import { NextRequest, NextResponse } from 'next/server';
import { getOnchainHistory } from '@/lib/onchain';

// Fetch last N ERC-20 transfers (WLD) for an address
// Priority: World Chain (Worldscan) -> BaseScan -> Optimism (if configured)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get('address') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 25);

    if (!address) {
      return NextResponse.json({ error: 'missing address' }, { status: 400 });
    }

    const list = await getOnchainHistory(address, limit);
    return NextResponse.json({ transactions: list });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
