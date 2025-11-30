import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Equipment, EquipmentInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EQUIPMENT_FILE = path.join(DATA_DIR, 'equipment.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(EQUIPMENT_FILE);
    } catch {
        await fs.writeFile(EQUIPMENT_FILE, '[]', 'utf8');
    }
}

export async function readEquipment(): Promise<Equipment[]> {
    await ensureDataFile();
    const raw = await fs.readFile(EQUIPMENT_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Equipment[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Equipment[]): Promise<void> {
    const tmp = EQUIPMENT_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, EQUIPMENT_FILE);
}

export async function writeEquipment(items: Equipment[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listEquipment(): Promise<Equipment[]> {
    const all = await readEquipment();
    return [...all].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
    const all = await readEquipment();
    const eq: Equipment = {
        id: newId(),
        name: input.name.trim(),
        procedureIds: Array.isArray(input.procedureIds) ? input.procedureIds.map(String) : [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(eq);
    await writeEquipment(all);
    return eq;
}

export async function getEquipment(id: string): Promise<Equipment | undefined> {
    const all = await readEquipment();
    return all.find(m => m.id === id);
}

export async function updateEquipment(id: string, input: Partial<EquipmentInput>): Promise<Equipment | undefined> {
    const all = await readEquipment();
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Equipment = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        procedureIds: input.procedureIds !== undefined ? input.procedureIds.map(String) : current.procedureIds,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeEquipment(all);
    return updated;
}

export async function deleteEquipment(id: string): Promise<boolean> {
    const all = await readEquipment();
    const filtered = all.filter(m => m.id !== id);
    if (filtered.length === all.length) return false;
    await writeEquipment(filtered);
    return true;
}
