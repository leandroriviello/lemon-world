import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getErc20Balance } from '@/lib/onchain';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.walletAddress) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const address = session.user.walletAddress;
  const bal = await getErc20Balance(address);
  return NextResponse.json({ balance: bal.value, decimals: bal.decimals });
}

