import crypto from 'crypto';
import type {Procedure, ProcedureInput} from '@/lib/types';
import {query} from '@/lib/db';

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listProcedures(): Promise<Procedure[]> {
    const rows = await query<any>(
        `SELECT id, name, procedure, created_at, updated_at
         FROM procedures
         ORDER BY lower(name)`
    );
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        procedure: r.procedure,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createProcedure(input: ProcedureInput): Promise<Procedure> {
    const id = newId();
    const name = input.name.trim();
    const proc = input.procedure.trim();
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(`INSERT INTO procedures (id, name, procedure, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5)`, [
        id,
        name,
        proc,
        createdAt,
        updatedAt,
    ]);
    return {id, name, procedure: proc, createdAt, updatedAt};
}

export async function getProcedure(id: string): Promise<Procedure | undefined> {
    const rows = await query<any>(
        `SELECT id, name, procedure, created_at, updated_at
         FROM procedures
         WHERE id = $1`,
        [id]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {id: r.id, name: r.name, procedure: r.procedure, createdAt: r.created_at, updatedAt: r.updated_at};
}

export async function updateProcedure(id: string, input: Partial<ProcedureInput>): Promise<Procedure | undefined> {
    const current = await getProcedure(id);
    if (!current) return undefined;
    const name = input.name !== undefined ? input.name.trim() : current.name;
    const proc = input.procedure !== undefined ? input.procedure.trim() : current.procedure;
    const updatedAt = nowISO();
    await query(`UPDATE procedures
                 SET name=$2,
                     procedure=$3,
                     updated_at=$4
                 WHERE id = $1`, [id, name, proc, updatedAt]);
    return {...current, name, procedure: proc, updatedAt};
}

export async function deleteProcedure(id: string): Promise<boolean> {
    await query(`DELETE
                 FROM procedures
                 WHERE id = $1`, [id]);
    const check = await getProcedure(id);
    return !check;
}

export async function readProcedures(): Promise<Procedure[]> {
    return listProcedures();
}
