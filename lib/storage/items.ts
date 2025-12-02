import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Item, ItemInput} from '@/lib/types';
import {byNameCI, sorted} from '@/lib/utils/sort';

const DATA_DIR = path.join(process.cwd(), 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(ITEMS_FILE);
    } catch {
        await fs.writeFile(ITEMS_FILE, '[]', 'utf8');
    }
}

export async function readItems(): Promise<Item[]> {
    await ensureDataFile();
    const raw = await fs.readFile(ITEMS_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Item[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Item[]): Promise<void> {
    const tmp = ITEMS_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, ITEMS_FILE);
}

export async function writeItems(items: Item[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listItemsByLocation(locationId: string): Promise<Item[]> {
    const all = await readItems();
    return sorted(
        all.filter(i => i.locationId === locationId),
        byNameCI
    );
}

export async function createItem(locationId: string, input: ItemInput): Promise<Item> {
    const all = await readItems();
    const item: Item = {
        id: newId(),
        locationId,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        equipmentId: input.equipmentId ? String(input.equipmentId) : undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(item);
    await writeItems(all);
    return item;
}

export async function getItem(locationId: string, id: string): Promise<Item | undefined> {
    const all = await readItems();
    return all.find(i => i.id === id && i.locationId === locationId);
}

export async function updateItem(locationId: string, id: string, input: Partial<ItemInput>): Promise<Item | undefined> {
    const all = await readItems();
    const idx = all.findIndex(i => i.id === id && i.locationId === locationId);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Item = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        description: input.description !== undefined ? (input.description?.trim() || undefined) : current.description,
        equipmentId: Object.prototype.hasOwnProperty.call(input, 'equipmentId')
            ? (input.equipmentId ? String(input.equipmentId) : undefined)
            : current.equipmentId,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeItems(all);
    return updated;
}

export async function deleteItem(locationId: string, id: string): Promise<boolean> {
    const all = await readItems();
    const filtered = all.filter(i => !(i.id === id && i.locationId === locationId));
    if (filtered.length === all.length) return false;
    await writeItems(filtered);
    return true;
}

export async function deleteItemsByLocation(locationId: string): Promise<void> {
    const all = await readItems();
    const filtered = all.filter(i => i.locationId !== locationId);
    if (filtered.length !== all.length) {
        await writeItems(filtered);
    }
}
