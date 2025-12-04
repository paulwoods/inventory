import crypto from 'crypto';
import type {Equipment, EquipmentInput} from '@/lib/types';
import {query, withTransaction} from '@/lib/db';

function nowISO() {
    return new Date().toISOString();
}

function newId() {
    return (
        (crypto as any).randomUUID?.() ??
        crypto.createHash('sha256').update(Math.random().toString() + Date.now()).digest('hex').slice(0, 32)
    );
}

export async function listEquipment(): Promise<Equipment[]> {
    const rows = await query<any>(
        `SELECT e.id,
                e.name,
                e.created_at,
                e.updated_at,
                COALESCE(array_agg(ep.procedure_id) FILTER (WHERE ep.procedure_id IS NOT NULL), '{}') AS procedure_ids
         FROM equipment e
                  LEFT JOIN equipment_procedures ep ON ep.equipment_id = e.id
         GROUP BY e.id
         ORDER BY lower(e.name)`
    );
    return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        procedureIds: (r.procedure_ids as string[]) ?? [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

export async function createEquipment(input: EquipmentInput): Promise<Equipment> {
    const id = newId();
    const name = input.name.trim();
    const procedureIds = Array.isArray(input.procedureIds) ? input.procedureIds.map(String) : [];
    const createdAt = nowISO();
    const updatedAt = createdAt;
    await withTransaction(async (client) => {
        await client.query(
            `INSERT INTO equipment (id, name, created_at, updated_at)
             VALUES ($1, $2, $3, $4)`,
            [id, name, createdAt, updatedAt]
        );
        if (procedureIds.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            procedureIds.forEach((pid, idx) => {
                values.push(id, pid);
                placeholders.push(`($${2 * idx + 1}, $${2 * idx + 2})`);
            });
            await client.query(
                `INSERT INTO equipment_procedures (equipment_id, procedure_id)
                 VALUES ${placeholders.join(',')}`,
                values
            );
        }
    });
    return {id, name, procedureIds, createdAt, updatedAt};
}

export async function getEquipment(id: string): Promise<Equipment | undefined> {
    const rows = await query<any>(
        `SELECT e.id,
                e.name,
                e.created_at,
                e.updated_at,
                COALESCE(array_agg(ep.procedure_id) FILTER (WHERE ep.procedure_id IS NOT NULL), '{}') AS procedure_ids
         FROM equipment e
                  LEFT JOIN equipment_procedures ep ON ep.equipment_id = e.id
         WHERE e.id = $1
         GROUP BY e.id`,
        [id]
    );
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
        id: r.id,
        name: r.name,
        procedureIds: (r.procedure_ids as string[]) ?? [],
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export async function updateEquipment(id: string, input: Partial<EquipmentInput>): Promise<Equipment | undefined> {
    const existing = await getEquipment(id);
    if (!existing) return undefined;
    const name = input.name !== undefined ? input.name.trim() : existing.name;
    const procIds = input.procedureIds !== undefined ? input.procedureIds.map(String) : existing.procedureIds;
    const updatedAt = nowISO();
    await withTransaction(async (client) => {
        await client.query(`UPDATE equipment
                            SET name=$2,
                                updated_at=$3
                            WHERE id = $1`, [id, name, updatedAt]);
        // reset mappings
        await client.query(`DELETE
                            FROM equipment_procedures
                            WHERE equipment_id = $1`, [id]);
        if (procIds.length > 0) {
            const values: any[] = [];
            const placeholders: string[] = [];
            procIds.forEach((pid, idx) => {
                values.push(id, pid);
                placeholders.push(`($${2 * idx + 1}, $${2 * idx + 2})`);
            });
            await client.query(
                `INSERT INTO equipment_procedures (equipment_id, procedure_id)
                 VALUES ${placeholders.join(',')}`,
                values
            );
        }
    });
    return {id, name, procedureIds: procIds, createdAt: existing.createdAt, updatedAt};
}

export async function deleteEquipment(id: string): Promise<boolean> {
    await query(`DELETE
                 FROM equipment
                 WHERE id = $1`, [id]);
    const check = await getEquipment(id);
    return !check;
}
