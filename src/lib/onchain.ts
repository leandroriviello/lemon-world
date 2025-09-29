// Utility helpers to fetch balances and on-chain history

const hexStrip = (s: string) => (s.startsWith('0x') ? s.slice(2) : s);

const pad32 = (s: string) => hexStrip(s).padStart(64, '0');

const toChecksumAddress = (addr: string) => addr.toLowerCase(); // keep simple; upstream handles checksums

export type BalanceResult = {
  raw: string; // hex string from RPC
  decimals: number;
  value: number; // normalized by decimals
  source: 'worldchain' | 'base' | 'optimism' | 'ethereum';
};

/**
 * Calls the ERC-20 balanceOf(address) via Alchemy (or compatible RPC).
 */
type Network = 'worldchain' | 'base' | 'optimism' | 'ethereum';

function networksFromEnv() {
  const decimals = Number(process.env.WLD_DECIMALS || '18');
  const key = process.env.ALCHEMY_API_KEY || '';
  const map: Record<Network, { rpc: string; contract: string }> = {
    worldchain: {
      // Accept any compatible RPC; prefer explicit WORLDCHAIN RPC over Alchemy.
      // Example (if using Alchemy): https://worldchain-mainnet.g.alchemy.com/v2/<KEY>
      rpc: process.env.WORLDCHAIN_RPC_URL || '',
      contract: process.env.WLD_CONTRACT_WORLDCHAIN || '',
    },
    base: {
      rpc: process.env.ALCHEMY_BASE_RPC_URL || (key ? `https://base-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: process.env.WLD_CONTRACT_BASE || '',
    },
    optimism: {
      rpc: process.env.ALCHEMY_OPT_RPC_URL || (key ? `https://opt-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: process.env.WLD_CONTRACT_OPTIMISM || '',
    },
    ethereum: {
      rpc: process.env.ALCHEMY_ETH_RPC_URL || (key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: process.env.WLD_CONTRACT_ETHEREUM || '',
    },
  };
  return { decimals, map };
}

async function getBalanceFor(address: string, network: Network): Promise<BalanceResult | null> {
  const { decimals, map } = networksFromEnv();
  const cfg = map[network];
  if (!cfg.rpc || !cfg.contract) return null;
  const selector = '70a08231'; // balanceOf(address)
  const addr = toChecksumAddress(address);
  const data = `0x${selector}${pad32(addr)}`;
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
    if (!raw) return null;
    console.log('[balance] network=%s addr=%s contract=%s raw=%s', network, addr, cfg.contract, raw);
    const bi = BigInt(raw);
    const denom = BigInt(10) ** BigInt(decimals);
    const whole = Number(bi / denom);
    const frac = Number(bi % denom) / Number(denom);
    const value = whole + frac;
    return { raw, decimals, value, source: network };
  } catch (e) {
    console.warn('[balance] %s call failed:', network, e);
    return null;
  }
}

export async function getErc20Balance(address: string, network?: Network): Promise<BalanceResult | null> {
  if (network) return getBalanceFor(address, network);
  // Try in priority order: worldchain -> optimism -> base -> ethereum
  for (const n of ['worldchain', 'optimism', 'base', 'ethereum'] as Network[]) {
    const r = await getBalanceFor(address, n);
    if (r) return r;
  }
  return null;
}

export type BalanceBreakdown = {
  total: number;
  decimals: number;
  details: BalanceResult[];
};

export async function getErc20Balances(address: string): Promise<BalanceBreakdown | null> {
  const results = (await Promise.all([
    getErc20Balance(address, 'worldchain'),
    getErc20Balance(address, 'optimism'),
    getErc20Balance(address, 'base'),
    getErc20Balance(address, 'ethereum'),
  ])).filter((x): x is BalanceResult => Boolean(x));
  if (results.length === 0) return null;
  const decimals = results[0].decimals;
  const total = results.reduce((acc, r) => acc + r.value, 0);
  return { total, decimals, details: results };
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
  // Helper to query Etherscan/Blockscout-compatible API
  const fetchFrom = async (apiBase: string, apiKey: string | undefined, contract: string | undefined) => {
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address,
      sort: 'desc',
      page: '1',
      offset: String(Math.min(Math.max(limit, 1), 25)),
    });
    if (contract) params.set('contractaddress', contract);
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
      type ScanTx = {
        hash: string;
        to?: string;
        value?: string;
        timeStamp: string;
        tokenSymbol?: string;
        tokenDecimal?: string;
      };
      const arr = j.result as ScanTx[];
      const filtered = contract ? arr : arr.filter(tx => (tx.tokenSymbol || '').toUpperCase() === 'WLD');
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
  };

  // 1) Try World Chain (Worldscan / Blockscout)
  const worldApi = process.env.WORLDCHAIN_API_URL || '';
  const worldKey = process.env.WORLDCHAIN_API_KEY || '';
  const worldContract = process.env.WLD_CONTRACT_WORLDCHAIN || '';
  if (worldApi) {
    const list = await fetchFrom(worldApi, worldKey || undefined, worldContract || undefined);
    if (list.length > 0) return list;
  }

  // 2) Fallback to BaseScan
  const baseApi = process.env.BASESCAN_API_URL || 'https://api.basescan.org/api';
  const baseKey = process.env.BASESCAN_API_KEY || '';
  const baseContract = process.env.WLD_CONTRACT_BASE || '';
  const list = await fetchFrom(baseApi, baseKey || undefined, baseContract || undefined);
  if (list.length > 0) return list;

  // 3) Last resort: try Optimism Etherscan-compatible if provided via env
  const optApi = process.env.OPTIMISM_API_URL || '';
  const optKey = process.env.OPTIMISM_API_KEY || '';
  const optContract = process.env.WLD_CONTRACT_OPTIMISM || '';
  if (optApi) return fetchFrom(optApi, optKey || undefined, optContract || undefined);
  return [];
}
