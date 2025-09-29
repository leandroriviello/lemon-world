import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getErc20Balance, getErc20Balances } from '@/lib/onchain';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const address = session.user.walletAddress;
  const debug = new URL(req.url).searchParams.get('debug') === '1';
  // Try multi-network first (aggregate), fallback to single
  const agg = await getErc20Balances(address);
  if (agg) {
    return NextResponse.json({
      balance: agg.total,
      decimals: agg.decimals,
      breakdown: agg.details,
      address,
      ...(debug
        ? {
            env: {
              WLD_CONTRACT_WORLDCHAIN: process.env.WLD_CONTRACT_WORLDCHAIN || null,
              WLD_CONTRACT_BASE: process.env.WLD_CONTRACT_BASE || null,
              WLD_CONTRACT_OPTIMISM: process.env.WLD_CONTRACT_OPTIMISM || null,
              WLD_CONTRACT_ETHEREUM: process.env.WLD_CONTRACT_ETHEREUM || null,
              WORLDCHAIN_RPC_URL: process.env.WORLDCHAIN_RPC_URL || null,
              ALCHEMY_BASE_RPC_URL: process.env.ALCHEMY_BASE_RPC_URL || null,
              ALCHEMY_OPT_RPC_URL: process.env.ALCHEMY_OPT_RPC_URL || null,
              ALCHEMY_ETH_RPC_URL: process.env.ALCHEMY_ETH_RPC_URL || null,
            },
          }
        : {}),
    });
  }
  const bal = await getErc20Balance(address);
  if (!bal) return NextResponse.json({ balance: null, address });
  return NextResponse.json({ balance: bal.value, decimals: bal.decimals, source: bal.source, address });
}
