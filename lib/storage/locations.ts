import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Location, LocationInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCATIONS_FILE = path.join(DATA_DIR, 'locations.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(LOCATIONS_FILE);
    } catch {
        await fs.writeFile(LOCATIONS_FILE, '[]', 'utf8');
    }
}

export async function readLocations(): Promise<Location[]> {
    await ensureDataFile();
    const raw = await fs.readFile(LOCATIONS_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Location[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(locs: Location[]): Promise<void> {
    const tmp = LOCATIONS_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(locs, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, LOCATIONS_FILE);
}

export async function writeLocations(locs: Location[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(locs));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listLocationsByHome(homeId: string): Promise<Location[]> {
    const all = await readLocations();
    return all.filter(l => l.homeId === homeId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createLocation(homeId: string, input: LocationInput): Promise<Location> {
    const all = await readLocations();
    const loc: Location = {
        id: newId(),
        homeId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(loc);
    await writeLocations(all);
    return loc;
}

export async function getLocation(homeId: string, id: string): Promise<Location | undefined> {
    const all = await readLocations();
    return all.find(l => l.id === id && l.homeId === homeId);
}

export async function updateLocation(homeId: string, id: string, input: Partial<LocationInput>): Promise<Location | undefined> {
    const all = await readLocations();
    const idx = all.findIndex(l => l.id === id && l.homeId === homeId);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Location = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        description: input.description !== undefined ? (input.description?.trim() || undefined) : current.description,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeLocations(all);
    return updated;
}

export async function deleteLocation(homeId: string, id: string): Promise<boolean> {
    const all = await readLocations();
    const filtered = all.filter(l => !(l.id === id && l.homeId === homeId));
    if (filtered.length === all.length) return false;
    await writeLocations(filtered);
    return true;
}

export async function deleteLocationsByHome(homeId: string): Promise<void> {
    const all = await readLocations();
    const filtered = all.filter(l => l.homeId !== homeId);
    if (filtered.length !== all.length) {
        await writeLocations(filtered);
    }
}
