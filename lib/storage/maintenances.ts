import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Maintenance, MaintenanceInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MAINTENANCE_FILE = path.join(DATA_DIR, 'maintenances.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(MAINTENANCE_FILE);
    } catch {
        await fs.writeFile(MAINTENANCE_FILE, '[]', 'utf8');
    }
}

export async function readMaintenances(): Promise<Maintenance[]> {
    await ensureDataFile();
    const raw = await fs.readFile(MAINTENANCE_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Maintenance[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Maintenance[]): Promise<void> {
    const tmp = MAINTENANCE_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, MAINTENANCE_FILE);
}

export async function writeMaintenances(items: Maintenance[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listMaintenances(): Promise<Maintenance[]> {
    const all = await readMaintenances();
    return [...all].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
}

export async function createMaintenance(input: MaintenanceInput): Promise<Maintenance> {
    const all = await readMaintenances();
    const m: Maintenance = {
        id: newId(),
        name: input.name.trim(),
        procedure: input.procedure.trim(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(m);
    await writeMaintenances(all);
    return m;
}

export async function getMaintenance(id: string): Promise<Maintenance | undefined> {
    const all = await readMaintenances();
    return all.find(m => m.id === id);
}

export async function updateMaintenance(id: string, input: Partial<MaintenanceInput>): Promise<Maintenance | undefined> {
    const all = await readMaintenances();
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Maintenance = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        procedure: input.procedure !== undefined ? input.procedure.trim() : current.procedure,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeMaintenances(all);
    return updated;
}

export async function deleteMaintenance(id: string): Promise<boolean> {
    const all = await readMaintenances();
    const filtered = all.filter(m => m.id !== id);
    if (filtered.length === all.length) return false;
    await writeMaintenances(filtered);
    return true;
}
