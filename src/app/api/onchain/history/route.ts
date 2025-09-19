import { NextRequest, NextResponse } from 'next/server';

// Fetch last N ERC-20 transfers (WLD) for an address from BaseScan
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get('address') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 25);

    if (!address) {
      return NextResponse.json({ error: 'missing address' }, { status: 400 });
    }

    const apiKey = process.env.BASESCAN_API_KEY || '';
    const apiBase = process.env.BASESCAN_API_URL || 'https://api.basescan.org/api';
    const wldContract = process.env.WLD_CONTRACT_BASE || '';

    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address,
      sort: 'desc',
      page: '1',
      offset: String(limit),
    });
    if (wldContract) params.set('contractaddress', wldContract);
    if (apiKey) params.set('apikey', apiKey);

    const url = `${apiBase}?${params.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json();

    if (!j || (j.status && j.status !== '1') || !Array.isArray(j.result)) {
      // Return empty list to avoid breaking UI
      return NextResponse.json({ transactions: [] });
    }

    const toNumber = (v: string, decStr?: string) => {
      try {
        const n = BigInt(v || '0');
        const decimals = Number(decStr || process.env.WLD_DECIMALS || '18');
        const denom = BigInt(10) ** BigInt(decimals);
        const whole = Number(n / denom);
        const frac = Number(n % denom) / Number(denom);
        return whole + frac;
      } catch {
        return 0;
      }
    };

    type BaseScanTx = {
      hash: string;
      to?: string;
      value?: string;
      timeStamp: string;
      tokenSymbol?: string;
      tokenDecimal?: string;
    };
    const arr = j.result as BaseScanTx[];
    const filtered = wldContract
      ? arr.filter(() => true) // contractaddress already filters
      : arr.filter(tx => (tx.tokenSymbol || '').toUpperCase() === 'WLD');
    const mapped = filtered.map((tx) => ({
      id: tx.hash,
      amount: toNumber(tx.value ?? '0', tx.tokenDecimal),
      to: (tx.to || '').toLowerCase(),
      status: 'success' as const,
      hash: tx.hash,
      timestamp: Number(tx.timeStamp) * 1000,
      reference: undefined as string | undefined,
    }));

    return NextResponse.json({ transactions: mapped });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
