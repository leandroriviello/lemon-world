import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type SavedTx = {
  transaction_id?: string;
  reference?: string;
  txHash?: string;
  amount: number;
  symbol: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'unknown';
};

const storeFile = path.join(process.cwd(), 'data', 'transactions.json');

async function readStore(): Promise<SavedTx[]> {
  try {
    const raw = await fs.readFile(storeFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function fetchWorldStatus(txId: string) {
  const appId = process.env.WORLD_APP_ID || process.env.NEXT_PUBLIC_APP_ID || '';
  const apiKey = process.env.WORLD_API_KEY || '';
  if (!appId || !apiKey) return null;
  try {
    const url = `https://developer.worldcoin.org/api/v2/minikit/transaction/${encodeURIComponent(txId)}?app_id=${encodeURIComponent(appId)}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j;
  } catch {
    return null;
  }
}

export async function GET() {
  const list = await readStore();

  // Merge status from World API when possible
  const merged = await Promise.all(list.map(async (t) => {
    if (!t.transaction_id) return t;
    const world = await fetchWorldStatus(t.transaction_id);
    if (!world) return t;

    // Expected shape: { status: 'pending'|'mined'|'failed', tx_hash?: string, ... }
    const s = String(world?.status || '').toLowerCase();
    const status: SavedTx['status'] = s === 'mined' ? 'confirmed' : s === 'failed' ? 'failed' : s === 'pending' ? 'pending' : t.status;
    const txHash = (world?.tx_hash as string | undefined) || t.txHash;
    return { ...t, status, txHash } satisfies SavedTx;
  }));

  // Sort by timestamp desc
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return NextResponse.json({ transactions: merged });
}
