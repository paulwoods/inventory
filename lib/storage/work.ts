import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Work, WorkInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKS_FILE = path.join(DATA_DIR, 'works.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(WORKS_FILE);
    } catch {
        await fs.writeFile(WORKS_FILE, '[]', 'utf8');
    }
}

export async function readWorks(): Promise<Work[]> {
    await ensureDataFile();
    const raw = await fs.readFile(WORKS_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Work[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Work[]): Promise<void> {
    const tmp = WORKS_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, WORKS_FILE);
}

export async function writeWorks(items: Work[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return (
        (crypto as any).randomUUID?.() ??
        crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32)
    );
}

export async function listWorksByService(serviceId: string): Promise<Work[]> {
    const all = await readWorks();
    return all
        .filter(w => w.serviceId === serviceId)
        .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
        .reverse();
}

export async function createWork(serviceId: string, input: WorkInput = {}): Promise<Work> {
    const all = await readWorks();
    const performedAt = input.performedAt ? new Date(input.performedAt).toISOString() : nowISO();
    const w: Work = {
        id: newId(),
        serviceId,
        performedAt,
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(w);
    await writeWorks(all);
    return w;
}

export async function getWork(id: string): Promise<Work | undefined> {
    const all = await readWorks();
    return all.find(w => w.id === id);
}

export async function deleteWork(id: string): Promise<boolean> {
    const all = await readWorks();
    const filtered = all.filter(w => w.id !== id);
    if (filtered.length === all.length) return false;
    await writeWorks(filtered);
    return true;
}

export async function deleteWorksByService(serviceId: string): Promise<void> {
    const all = await readWorks();
    const filtered = all.filter(w => w.serviceId !== serviceId);
    if (filtered.length !== all.length) {
        await writeWorks(filtered);
    }
}
