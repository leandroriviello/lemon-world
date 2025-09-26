import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getErc20Balance, getErc20Balances } from '@/lib/onchain';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const address = session.user.walletAddress;
  // Try multi-network first (aggregate), fallback to single
  const agg = await getErc20Balances(address);
  if (agg) {
    return NextResponse.json({ balance: agg.total, decimals: agg.decimals, breakdown: agg.details });
  }
  const bal = await getErc20Balance(address);
  if (!bal) return NextResponse.json({ balance: null });
  return NextResponse.json({ balance: bal.value, decimals: bal.decimals, source: bal.source });
}
