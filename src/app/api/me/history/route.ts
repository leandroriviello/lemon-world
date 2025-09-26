import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOnchainHistory } from '@/lib/onchain';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '10'), 25);
  const list = await getOnchainHistory(session.user.walletAddress, limit);
  return NextResponse.json({ transactions: list });
}

