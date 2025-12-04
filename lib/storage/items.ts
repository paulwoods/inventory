import crypto from 'crypto';
import type {Item, ItemInput} from '@/lib/types';
import {query} from '@/lib/db';

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listItemsByLocation(locationId: string): Promise<Item[]> {
    const rows = await query<any>(
        `SELECT id, location_id, name, description, equipment_id, created_at, updated_at
         FROM items
         WHERE location_id = $1
         ORDER BY lower(name)`,
        [locationId]
    );
    return rows.map(r => ({
        id: r.id,
        locationId: r.location_id,
        name: r.name,
        description: r.description ?? undefined,
        equipmentId: r.equipment_id ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createItem(locationId: string, input: ItemInput): Promise<Item> {
    const id = newId();
    const name = input.name.trim();
    const description = input.description?.trim() || undefined;
    const equipmentId = input.equipmentId ? String(input.equipmentId) : undefined;
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(
        `INSERT INTO items (id, location_id, name, description, equipment_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, locationId, name, description ?? null, equipmentId ?? null, createdAt, updatedAt]
    );
    return {id, locationId, name, description, equipmentId, createdAt, updatedAt};
}

export async function getItem(locationId: string, id: string): Promise<Item | undefined> {
    const rows = await query<any>(
        `SELECT id, location_id, name, description, equipment_id, created_at, updated_at
         FROM items
         WHERE id = $1
           AND location_id = $2`,
        [id, locationId]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        locationId: r.location_id,
        name: r.name,
        description: r.description ?? undefined,
        equipmentId: r.equipment_id ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function updateItem(locationId: string, id: string, input: Partial<ItemInput>): Promise<Item | undefined> {
    const current = await getItem(locationId, id);
    if (!current) return undefined;
    const name = input.name !== undefined ? input.name.trim() : current.name;
    const description = input.description !== undefined ? (input.description?.trim() || undefined) : current.description;
    const equipmentId = Object.prototype.hasOwnProperty.call(input, 'equipmentId')
        ? (input.equipmentId ? String(input.equipmentId) : undefined)
        : current.equipmentId;
    const updatedAt = nowISO();
    await query(
        `UPDATE items SET name=$3, description=$4, equipment_id=$5, updated_at=$6 WHERE id=$1 AND location_id=$2`,
        [id, locationId, name, description ?? null, equipmentId ?? null, updatedAt]
    );
    return {...current, name, description, equipmentId, updatedAt};
}

export async function deleteItem(locationId: string, id: string): Promise<boolean> {
    await query(`DELETE
                 FROM items
                 WHERE id = $1
                   AND location_id = $2`, [id, locationId]);
    const check = await getItem(locationId, id);
    return !check;
}

export async function deleteItemsByLocation(locationId: string): Promise<void> {
    await query(`DELETE
                 FROM items
                 WHERE location_id = $1`, [locationId]);
}

export async function readItems(): Promise<Item[]> {
    const rows = await query<any>(`SELECT id, location_id, name, description, equipment_id, created_at, updated_at
                                   FROM items`);
    return rows.map(r => ({
        id: r.id,
        locationId: r.location_id,
        name: r.name,
        description: r.description ?? undefined,
        equipmentId: r.equipment_id ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}
