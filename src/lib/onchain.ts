// Utility helpers to fetch balances and on-chain history

const hexStrip = (s: string) => (s.startsWith('0x') ? s.slice(2) : s);

const pad32 = (s: string) => hexStrip(s).padStart(64, '0');

const toChecksumAddress = (addr: string) => addr.toLowerCase(); // keep simple; upstream handles checksums

export type BalanceResult = {
  raw: string; // hex string from RPC
  decimals: number;
  value: number; // normalized by decimals
  source: 'base' | 'optimism';
};

/**
 * Calls the ERC-20 balanceOf(address) via Alchemy (or compatible RPC).
 */
export async function getErc20Balance(address: string): Promise<BalanceResult | null> {
  const decimals = Number(process.env.WLD_DECIMALS || '18');
  const key = process.env.ALCHEMY_API_KEY || '';
  const rpcBase = process.env.ALCHEMY_BASE_RPC_URL || (key ? `https://base-mainnet.g.alchemy.com/v2/${key}` : '');
  const rpcOpt = process.env.ALCHEMY_OPT_RPC_URL || (key ? `https://opt-mainnet.g.alchemy.com/v2/${key}` : '');
  const configs = [
    { name: 'base', rpc: rpcBase, contract: process.env.WLD_CONTRACT_BASE || '' },
    { name: 'optimism', rpc: rpcOpt, contract: process.env.WLD_CONTRACT_OPTIMISM || '' },
  ].filter(c => c.rpc && c.contract);

  if (configs.length === 0) return null; // not configured

  const selector = '70a08231'; // balanceOf(address)
  const addr = toChecksumAddress(address);
  const data = `0x${selector}${pad32(addr)}`;

  for (const cfg of configs) {
    const body = {
      id: 1,
      jsonrpc: '2.0' as const,
      method: 'eth_call',
      params: [
        { to: cfg.contract, data },
        'latest',
      ],
    };
    try {
      const r = await fetch(cfg.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const j = (await r.json()) as { result?: string };
      const raw = j?.result;
      if (!raw) continue;
      const bi = BigInt(raw);
      const denom = BigInt(10) ** BigInt(decimals);
      const whole = Number(bi / denom);
      const frac = Number(bi % denom) / Number(denom);
      const value = whole + frac;
      return { raw, decimals, value, source: cfg.name as 'base' | 'optimism' };
    } catch {
      // try next config
    }
  }
  return null;
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
