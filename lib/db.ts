import {Pool, PoolClient, QueryResult} from 'pg';

// Create a shared connection pool using DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    // Soft warning; some build steps might import files. Runtime API routes should have env set.
    // eslint-disable-next-line no-console
    console.warn('[db] DATABASE_URL is not set. Ensure it is configured in your environment.');
}
console.log('[db] Using connection string:', connectionString);

export const pool = new Pool({
    connectionString,
    // Allow SSL in hosted environments if DATABASE_SSL=true
    ssl: process.env.DATABASE_SSL === 'true' ? {rejectUnauthorized: false} : undefined,
    max: Number(process.env.PGPOOL_MAX || 10),
    idleTimeoutMillis: 30_000,
});

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
    const res: QueryResult<T> = await pool.query(text, params);
    return res.rows;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch {
        }
        throw err;
    } finally {
        client.release();
    }
}
