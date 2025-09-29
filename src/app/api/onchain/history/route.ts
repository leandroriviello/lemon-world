import { NextRequest, NextResponse } from 'next/server';
import { getOnchainHistory, getOnchainHistoryDebug } from '@/lib/onchain';

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

    const isDebug = searchParams.get('debug') === '1';
    if (isDebug) {
      const { transactions, meta } = await getOnchainHistoryDebug(address, limit);
      return NextResponse.json({
        transactions,
        meta,
        env: {
          WORLDCHAIN_API_URL: process.env.WORLDCHAIN_API_URL || null,
          WORLDCHAIN_RPC_URL: process.env.WORLDCHAIN_RPC_URL || null,
          WLD_CONTRACT_WORLDCHAIN: process.env.WLD_CONTRACT_WORLDCHAIN || null,
          ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ? 'set' : null,
        },
      });
    }
    const list = await getOnchainHistory(address, limit);
    return NextResponse.json({ transactions: list });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
