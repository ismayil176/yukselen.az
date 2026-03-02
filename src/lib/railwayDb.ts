import "server-only";

import { Pool } from "pg";

// Railway provides DATABASE_URL for Postgres.
// We use a very small KV abstraction (app_kv table) to keep the existing app logic.

let _pool: Pool | null = null;

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Database not configured: DATABASE_URL is missing. In Railway: add a Postgres plugin to your project, then add DATABASE_URL to the service variables (Railway usually injects it automatically)."
    );
  }

  if (!_pool) {
    _pool = new Pool({ connectionString: url });
  }
  return _pool;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const pool = getPool();
  const res = await pool.query<{ value: any }>("select value from public.app_kv where key = $1", [key]);
  if (res.rowCount && res.rows[0]?.value !== undefined && res.rows[0]?.value !== null) {
    return res.rows[0].value as T;
  }
  return fallback;
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  const pool = getPool();
  await pool.query(
    `insert into public.app_kv (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key)
     do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

export async function delKey(key: string): Promise<void> {
  const pool = getPool();
  await pool.query("delete from public.app_kv where key = $1", [key]);
}

// --- Images (stored in Postgres) ---

export type DbImageRow = {
  image_key: string;
  content_type: string;
  bytes: Buffer;
  created_at: string;
};

export async function putImage(opts: {
  imageKey: string;
  contentType: string;
  bytes: Buffer;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `insert into public.images (image_key, content_type, bytes, created_at)
     values ($1, $2, $3, now())
     on conflict (image_key)
     do update set content_type = excluded.content_type, bytes = excluded.bytes`,
    [opts.imageKey, opts.contentType, opts.bytes]
  );
}

export async function getImage(imageKey: string): Promise<DbImageRow | null> {
  const pool = getPool();
  const res = await pool.query<DbImageRow>(
    "select image_key, content_type, bytes, created_at from public.images where image_key = $1",
    [imageKey]
  );
  return res.rowCount ? (res.rows[0] as any) : null;
}

export async function deleteImageRow(imageKey: string): Promise<void> {
  const pool = getPool();
  await pool.query("delete from public.images where image_key = $1", [imageKey]);
}
