import { NextRequest, NextResponse } from "next/server";
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

// Persist to a writeable temp dir by default (works on serverless platforms)
const storePath = path.join(process.env.DATA_DIR || '/tmp', 'lemon-planet');
const storeFile = path.join(storePath, 'transactions.json');

async function readStore(): Promise<SavedTx[]> {
  try {
    const raw = await fs.readFile(storeFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(items: SavedTx[]) {
  await fs.mkdir(storePath, { recursive: true });
  await fs.writeFile(storeFile, JSON.stringify(items, null, 2), 'utf8');
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { finalPayload, amount, to } = await req.json();
    const ok = Boolean(
      finalPayload &&
      finalPayload.status === 'success' &&
      (
        (typeof finalPayload.txHash === 'string' && finalPayload.txHash.length > 0) ||
        (typeof finalPayload.transaction_id === 'string' && finalPayload.transaction_id.length > 0)
      )
    );

    if (!ok) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Persist minimal transaction history locally
    try {
      const list = await readStore();
      const item: SavedTx = {
        transaction_id: finalPayload.transaction_id,
        reference: finalPayload.reference,
        txHash: finalPayload.txHash,
        amount: typeof amount === 'number' ? amount : Number(amount) || 0,
        symbol: 'WLD',
        to: String(to || ''),
        timestamp: Date.now(),
        status: 'submitted',
      };
      // Avoid duplicates by transaction_id
      const existingIdx = item.transaction_id
        ? list.findIndex((t) => t.transaction_id === item.transaction_id)
        : -1;
      if (existingIdx >= 0) list[existingIdx] = { ...list[existingIdx], ...item };
      else list.unshift(item);
      await writeStore(list);
    } catch {}

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
