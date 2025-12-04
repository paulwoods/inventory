import crypto from 'crypto';
import type {Home, HomeInput} from '@/lib/types';
import {query} from '@/lib/db';

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function createHome(input: HomeInput): Promise<Home> {
    const id = newId();
    const name = input.name.trim();
    const description = input.description?.trim() || undefined;
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(
        `INSERT INTO homes (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, name, description ?? null, createdAt, updatedAt]
    );
    return {id, name, description, createdAt, updatedAt};
}

export async function getHome(id: string): Promise<Home | undefined> {
    const rows = await query<any>(
        `SELECT id, name, description, created_at, updated_at
         FROM homes
         WHERE id = $1`,
        [id]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function updateHome(id: string, input: Partial<HomeInput>): Promise<Home | undefined> {
    const existing = await getHome(id);
    if (!existing) return undefined;
    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const description = input.description !== undefined ? (input.description?.trim() || undefined) : existing.description;
    const updatedAt = nowISO();
    await query(`UPDATE homes
                 SET name=$2,
                     description=$3,
                     updated_at=$4
                 WHERE id = $1`, [id, name, description ?? null, updatedAt]);
    return {id, name, description, createdAt: existing.createdAt, updatedAt};
}

export async function deleteHome(id: string): Promise<boolean> {
    const rows = await query<any>(`DELETE
                                   FROM homes
                                   WHERE id = $1`, [id]);
    // pg doesn't return rowCount via our helper; run EXISTS check
    // Instead, we can check affected via selecting after delete
    const check = await getHome(id);
    return !check;
}

export async function readHomes(): Promise<Home[]> {
    const rows = await query<any>(`SELECT id, name, description, created_at, updated_at
                                   FROM homes`);
    return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}
