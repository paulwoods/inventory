import crypto from 'crypto';
import type {Location, LocationInput} from '@/lib/types';
import {query} from '@/lib/db';

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return crypto.randomUUID?.() ?? crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32);
}

export async function listLocationsByHome(homeId: string): Promise<Location[]> {
    const rows = await query<any>(
        `SELECT id, home_id, name, description, created_at, updated_at
         FROM locations
         WHERE home_id = $1
         ORDER BY lower(name)`,
        [homeId]
    );
    return rows.map(r => ({
        id: r.id,
        homeId: r.home_id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createLocation(homeId: string, input: LocationInput): Promise<Location> {
    const id = newId();
    const name = input.name.trim();
    const description = input.description?.trim() || undefined;
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await query(
        `INSERT INTO locations (id, home_id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, homeId, name, description ?? null, createdAt, updatedAt]
    );
    return {id, homeId, name, description, createdAt, updatedAt};
}

export async function getLocation(homeId: string, id: string): Promise<Location | undefined> {
    const rows = await query<any>(
        `SELECT id, home_id, name, description, created_at, updated_at
         FROM locations
         WHERE id = $1
           AND home_id = $2`,
        [id, homeId]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        homeId: r.home_id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

export async function updateLocation(homeId: string, id: string, input: Partial<LocationInput>): Promise<Location | undefined> {
    const current = await getLocation(homeId, id);
    if (!current) return undefined;
    const name = input.name !== undefined ? input.name.trim() : current.name;
    const description = input.description !== undefined ? (input.description?.trim() || undefined) : current.description;
    const updatedAt = nowISO();
    await query(`UPDATE locations
                 SET name=$3,
                     description=$4,
                     updated_at=$5
                 WHERE id = $1
                   AND home_id = $2`, [id, homeId, name, description ?? null, updatedAt]);
    return {...current, name, description, updatedAt};
}

export async function deleteLocation(homeId: string, id: string): Promise<boolean> {
    await query(`DELETE
                 FROM locations
                 WHERE id = $1
                   AND home_id = $2`, [id, homeId]);
    const check = await getLocation(homeId, id);
    return !check;
}

export async function deleteLocationsByHome(homeId: string): Promise<void> {
    await query(`DELETE
                 FROM locations
                 WHERE home_id = $1`, [homeId]);
}

export async function readLocations(): Promise<Location[]> {
    const rows = await query<any>(`SELECT id, home_id, name, description, created_at, updated_at
                                   FROM locations`);
    return rows.map(r => ({
        id: r.id,
        homeId: r.home_id,
        name: r.name,
        description: r.description ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}
