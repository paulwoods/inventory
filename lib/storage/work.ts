import crypto from 'crypto';
import type {Work, WorkInput} from '@/lib/types';
import {query} from '@/lib/db';

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
    const rows = await query<any>(
        `SELECT id, service_id, performed_at, created_at, updated_at
         FROM works
         WHERE service_id = $1
         ORDER BY performed_at DESC`,
        [serviceId]
    );
    return rows.map((r: any) => ({
        id: r.id,
        serviceId: r.service_id,
        performedAt: r.performed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createWork(serviceId: string, input: WorkInput = {}): Promise<Work> {
    const id = newId();
    const performedAt = input.performedAt ? new Date(input.performedAt).toISOString() : nowISO();
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(
        `INSERT INTO works (id, service_id, performed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, serviceId, performedAt, createdAt, updatedAt]
    );
    return {id, serviceId, performedAt, createdAt, updatedAt};
}

export async function getWork(id: string): Promise<Work | undefined> {
    const rows = await query<any>(
        `SELECT id, service_id, performed_at, created_at, updated_at
         FROM works
         WHERE id = $1`,
        [id]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        serviceId: r.service_id,
        performedAt: r.performed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function deleteWork(id: string): Promise<boolean> {
    await query(`DELETE
                 FROM works
                 WHERE id = $1`, [id]);
    const check = await getWork(id);
    return !check;
}

export async function deleteWorksByService(serviceId: string): Promise<void> {
    await query(`DELETE
                 FROM works
                 WHERE service_id = $1`, [serviceId]);
}
