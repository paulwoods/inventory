import crypto from 'crypto';
import type {Service, ServiceInput} from '@/lib/types';
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

export async function listServicesByItem(itemId: string): Promise<Service[]> {
    const rows = await query<any>(
        `SELECT id, item_id, procedure_id, interval, created_at, updated_at
         FROM services
         WHERE item_id = $1
         ORDER BY updated_at DESC`,
        [itemId]
    );
    return rows.map((r: any) => ({
        id: r.id,
        itemId: r.item_id,
        procedureId: r.procedure_id,
        interval: r.interval,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createService(itemId: string, input: ServiceInput): Promise<Service> {
    const id = newId();
    const procedureId = input.procedureId.trim();
    const interval = Number(input.interval);
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(
        `INSERT INTO services (id, item_id, procedure_id, interval, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, itemId, procedureId, interval, createdAt, updatedAt]
    );
    return {id, itemId, procedureId, interval, createdAt, updatedAt};
}

export async function getService(id: string): Promise<Service | undefined> {
    const rows = await query<any>(
        `SELECT id, item_id, procedure_id, interval, created_at, updated_at
         FROM services
         WHERE id = $1`,
        [id]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        itemId: r.item_id,
        procedureId: r.procedure_id,
        interval: r.interval,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<Service | undefined> {
    const current = await getService(id);
    if (!current) return undefined;
    const procedureId = input.procedureId !== undefined ? input.procedureId.trim() : current.procedureId;
    const interval = input.interval !== undefined ? Number(input.interval) : current.interval;
    const updatedAt = nowISO();
    await query(
        `UPDATE services
         SET procedure_id=$2,
             interval=$3,
             updated_at=$4
         WHERE id = $1`,
        [id, procedureId, interval, updatedAt]
    );
    return {...current, procedureId, interval, updatedAt};
}

export async function deleteService(id: string): Promise<boolean> {
    await query(`DELETE
                 FROM services
                 WHERE id = $1`, [id]);
    const check = await getService(id);
    return !check;
}

export async function deleteServicesByItem(itemId: string): Promise<void> {
    await query(`DELETE
                 FROM services
                 WHERE item_id = $1`, [itemId]);
}
