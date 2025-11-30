import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Home, HomeInput} from '@/lib/types';
import {deleteLocationsByHome} from '@/lib/storage/locations';

const DATA_DIR = path.join(process.cwd(), 'data');
const HOMES_FILE = path.join(DATA_DIR, 'homes.json');

// Simple write queue to prevent concurrent writes clobbering
let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(HOMES_FILE);
    } catch {
        await fs.writeFile(HOMES_FILE, '[]', 'utf8');
    }
}

export async function readHomes(): Promise<Home[]> {
    await ensureDataFile();
    const raw = await fs.readFile(HOMES_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Home[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(homes: Home[]): Promise<void> {
    const tmp = HOMES_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(homes, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, HOMES_FILE);
}

export async function writeHomes(homes: Home[]): Promise<void> {
    // Chain writes
    writeQueue = writeQueue.then(() => atomicWrite(homes));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function createHome(input: HomeInput): Promise<Home> {
    const homes = await readHomes();
    const home: Home = {
        id: newId(),
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    homes.push(home);
    await writeHomes(homes);
    return home;
}

export async function getHome(id: string): Promise<Home | undefined> {
    const homes = await readHomes();
    return homes.find(h => h.id === id);
}

export async function updateHome(id: string, input: Partial<HomeInput>): Promise<Home | undefined> {
    const homes = await readHomes();
    const idx = homes.findIndex(h => h.id === id);
    if (idx === -1) return undefined;
    const current = homes[idx];
    const updated: Home = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        description: input.description !== undefined ? (input.description?.trim() || undefined) : current.description,
        updatedAt: nowISO(),
    };
    homes[idx] = updated;
    await writeHomes(homes);
    return updated;
}

export async function deleteHome(id: string): Promise<boolean> {
    const homes = await readHomes();
    const filtered = homes.filter(h => h.id !== id);
    if (filtered.length === homes.length) return false;
    await writeHomes(filtered);
    // Cascade delete locations for this home (best-effort)
    try {
        await deleteLocationsByHome(id);
    } catch {
        // ignore cascade errors
    }
    return true;
}
