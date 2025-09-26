import crypto from 'crypto';
import { Pool, type QueryResult } from 'pg';

// PostgreSQL connection (Railway)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function query<T = unknown>(text: string, params: ReadonlyArray<unknown> = []) {
  const client = await pool.connect();
  try {
    const res: QueryResult<T> = await client.query<T>(text, params as unknown[]);
    return res;
  } finally {
    client.release();
  }
}

type UserRow = { id: string; address: string; created_at: string };
type SessionRow = { id: string; user_id: string; token: string; created_at: string; expires_at: string | null };

export async function ensureUserUuidByAddress(address: string): Promise<string> {
  const addr = (address || '').toLowerCase();
  try {
    // 1) Try to find existing user by address
    const sel = await query<UserRow>('SELECT id FROM users WHERE address = $1 LIMIT 1', [addr]);
    if (sel.rows.length > 0) {
      return String(sel.rows[0].id);
    }

    // 2) Insert new user and return id
    const id = crypto.randomUUID();
    const ins = await query<UserRow>(
      'INSERT INTO users (id, address, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [id, addr],
    );
    return String(ins.rows[0].id);
  } catch (e: unknown) {
    // Handle race condition on unique(address)
    if (isPgUniqueViolation(e)) {
      const sel2 = await query<UserRow>('SELECT id FROM users WHERE address = $1 LIMIT 1', [addr]);
      if (sel2.rows.length > 0) return String(sel2.rows[0].id);
    }
    console.error('ensureUserUuidByAddress error:', e);
    throw e;
  }
}

export async function createSessionRecord(params: { userId: string; token: string; expiresAt?: Date | null }) {
  const { userId, token, expiresAt } = params;
  try {
    const id = crypto.randomUUID();
    const ins = await query<SessionRow>(
      'INSERT INTO sessions (id, user_id, token, created_at, expires_at) VALUES ($1, $2, $3, NOW(), $4) RETURNING *',
      [id, userId, token, expiresAt ? expiresAt.toISOString() : null],
    );
    return ins.rows[0];
  } catch (e: unknown) {
    if (isPgUniqueViolation(e)) {
      // Token conflict; return existing row
      const sel = await query<SessionRow>('SELECT * FROM sessions WHERE token = $1 LIMIT 1', [token]);
      return sel.rows[0];
    }
    console.error('createSessionRecord error:', e);
    throw e;
  }
}

export async function getUserIdByToken(token: string): Promise<string | null> {
  try {
    const sel = await query<Pick<SessionRow, 'user_id' | 'expires_at'>>(
      'SELECT user_id, expires_at FROM sessions WHERE token = $1 ORDER BY created_at DESC LIMIT 1',
      [token],
    );
    if (sel.rows.length === 0) return null;
    const row = sel.rows[0];
    if (row.expires_at && new Date(row.expires_at) <= new Date()) return null;
    return row.user_id;
  } catch (e) {
    console.error('getUserIdByToken error:', e);
    return null;
  }
}

function isPgUniqueViolation(err: unknown): err is { code: string } {
  if (typeof err !== 'object' || err === null) return false;
  const rec = err as Record<string, unknown>;
  return typeof rec.code === 'string' && rec.code === '23505';
}

export const SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP
);
`;
