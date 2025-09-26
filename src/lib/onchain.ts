// Utility helpers to fetch balances and on-chain history

const hexStrip = (s: string) => (s.startsWith('0x') ? s.slice(2) : s);

const pad32 = (s: string) => hexStrip(s).padStart(64, '0');

const toChecksumAddress = (addr: string) => addr.toLowerCase(); // keep simple; upstream handles checksums

export type BalanceResult = {
  raw: string; // hex string from RPC
  decimals: number;
  value: number; // normalized by decimals
};

/**
 * Calls the ERC-20 balanceOf(address) via Alchemy (or any RPC URL in ALCHEMY_BASE_RPC_URL).
 */
export async function getErc20Balance(address: string): Promise<BalanceResult> {
  const rpcUrl =
    process.env.ALCHEMY_BASE_RPC_URL ||
    (process.env.ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : '');
  const contract = process.env.WLD_CONTRACT_BASE || '';
  const decimals = Number(process.env.WLD_DECIMALS || '18');

  if (!rpcUrl || !contract) {
    return { raw: '0x0', decimals, value: 0 };
  }

  const selector = '70a08231'; // balanceOf(address)
  const addr = toChecksumAddress(address);
  const data = `0x${selector}${pad32(addr)}`;

  const body = {
    id: 1,
    jsonrpc: '2.0' as const,
    method: 'eth_call',
    params: [
      {
        to: contract,
        data,
      },
      'latest',
    ],
  };

  try {
    const r = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const j = (await r.json()) as { result?: string };
    const raw = j?.result || '0x0';
    const bi = BigInt(raw);
    const denom = BigInt(10) ** BigInt(decimals);
    const whole = Number(bi / denom);
    const frac = Number(bi % denom) / Number(denom);
    const value = whole + frac;
    return { raw, decimals, value };
  } catch {
    return { raw: '0x0', decimals, value: 0 };
  }
}

export type OnchainTx = {
  id: string;
  amount: number;
  to: string;
  status: 'success' | 'pending' | 'failed' | 'confirmed' | 'submitted' | 'unknown';
  hash?: string;
  txHash?: string;
  timestamp: number;
  reference?: string;
};

export async function getOnchainHistory(address: string, limit = 10): Promise<OnchainTx[]> {
  // Prefer BaseScan if configured (already used elsewhere in repo)
  const apiBase = process.env.BASESCAN_API_URL || 'https://api.basescan.org/api';
  const apiKey = process.env.BASESCAN_API_KEY || '';
  const wldContract = process.env.WLD_CONTRACT_BASE || '';

  const params = new URLSearchParams({
    module: 'account',
    action: 'tokentx',
    address,
    sort: 'desc',
    page: '1',
    offset: String(Math.min(Math.max(limit, 1), 25)),
  });
  if (wldContract) params.set('contractaddress', wldContract);
  if (apiKey) params.set('apikey', apiKey);

  try {
    const r = await fetch(`${apiBase}?${params.toString()}`, { cache: 'no-store' });
    const j = await r.json();
    if (!j || (j.status && j.status !== '1') || !Array.isArray(j.result)) return [];
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
    const filtered = wldContract ? arr : arr.filter(tx => (tx.tokenSymbol || '').toUpperCase() === 'WLD');
    return filtered.map((tx) => ({
      id: tx.hash,
      amount: toNumber(tx.value ?? '0', tx.tokenDecimal),
      to: (tx.to || '').toLowerCase(),
      status: 'success' as const,
      hash: tx.hash,
      timestamp: Number(tx.timeStamp) * 1000,
      reference: undefined,
    }));
  } catch {
    return [];
  }
}
