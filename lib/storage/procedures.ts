import {promises as fs} from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {Procedure, ProcedureInput} from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROCEDURE_FILE = path.join(DATA_DIR, 'procedures.json');

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDataFile() {
    try {
        await fs.mkdir(DATA_DIR, {recursive: true});
        await fs.access(PROCEDURE_FILE);
    } catch {
        await fs.writeFile(PROCEDURE_FILE, '[]', 'utf8');
    }
}

export async function readProcedures(): Promise<Procedure[]> {
    await ensureDataFile();
    const raw = await fs.readFile(PROCEDURE_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Procedure[];
        return [];
    } catch {
        return [];
    }
}

async function atomicWrite(items: Procedure[]): Promise<void> {
    const tmp = PROCEDURE_FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf8');
    await fs.rename(tmp, PROCEDURE_FILE);
}

export async function writeProcedures(items: Procedure[]): Promise<void> {
    writeQueue = writeQueue.then(() => atomicWrite(items));
    return writeQueue;
}

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listProcedures(): Promise<Procedure[]> {
    const all = await readProcedures();
    return [...all].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}));
}

export async function createProcedure(input: ProcedureInput): Promise<Procedure> {
    const all = await readProcedures();
    const m: Procedure = {
        id: newId(),
        name: input.name.trim(),
        procedure: input.procedure.trim(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
    };
    all.push(m);
    await writeProcedures(all);
    return m;
}

export async function getProcedure(id: string): Promise<Procedure | undefined> {
    const all = await readProcedures();
    return all.find(m => m.id === id);
}

export async function updateProcedure(id: string, input: Partial<ProcedureInput>): Promise<Procedure | undefined> {
    const all = await readProcedures();
    const idx = all.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    const current = all[idx];
    const updated: Procedure = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        procedure: input.procedure !== undefined ? input.procedure.trim() : current.procedure,
        updatedAt: nowISO(),
    };
    all[idx] = updated;
    await writeProcedures(all);
    return updated;
}

export async function deleteProcedure(id: string): Promise<boolean> {
    const all = await readProcedures();
    const filtered = all.filter(m => m.id !== id);
    if (filtered.length === all.length) return false;
    await writeProcedures(filtered);
    return true;
}
