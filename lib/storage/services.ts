import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Service, ServiceInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(SERVICES_FILE);
    } catch {
        await fs.writeFile(SERVICES_FILE, '[]', 'utf8');
    }
}

export async function readServices(): Promise<Service[]> {
    await ensureDataFile();
    const raw = await fs.readFile(SERVICES_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Service[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Service[]): Promise<void> {
    const tmp = SERVICES_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, SERVICES_FILE);
}

export async function writeServices(items: Service[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listServicesByItem(itemId: string): Promise<Service[]> {
    const all = await readServices();
    return all
        .filter(s => s.itemId === itemId)
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        .reverse();
}

export async function createService(itemId: string, input: ServiceInput): Promise<Service> {
    const all = await readServices();
    const svc: Service = {
        id: newId(),
        itemId,
        procedureId: input.procedureId.trim(),
        interval: input.interval,
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(svc);
    await writeServices(all);
    return svc;
}

export async function getService(id: string): Promise<Service | undefined> {
    const all = await readServices();
    return all.find(s => s.id === id);
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<Service | undefined> {
    const all = await readServices();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Service = {
        ...current,
        procedureId: input.procedureId !== undefined ? input.procedureId.trim() : current.procedureId,
        interval: input.interval !== undefined ? input.interval : current.interval,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeServices(all);
    return updated;
}

export async function deleteService(id: string): Promise<boolean> {
    const all = await readServices();
    const filtered = all.filter(s => s.id !== id);
    if (filtered.length === all.length) return false;
    await writeServices(filtered);
    return true;
}

export async function deleteServicesByItem(itemId: string): Promise<void> {
    const all = await readServices();
    const filtered = all.filter(s => s.itemId !== itemId);
    if (filtered.length !== all.length) {
        await writeServices(filtered);
    }
}
