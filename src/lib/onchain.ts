// Utility helpers to fetch balances and on-chain history

const hexStrip = (s: string) => (s.startsWith('0x') ? s.slice(2) : s);

const pad32 = (s: string) => hexStrip(s).padStart(64, '0');

const toChecksumAddress = (addr: string) => addr.toLowerCase(); // keep simple; upstream handles checksums
const envTrim = (v?: string | null) => (v || '').trim();

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
  const decimals = Number(envTrim(process.env.WLD_DECIMALS) || '18');
  const key = envTrim(process.env.ALCHEMY_API_KEY);
  const map: Record<Network, { rpc: string; contract: string }> = {
    worldchain: {
      // Accept any compatible RPC; prefer explicit WORLDCHAIN RPC over Alchemy.
      // Example: https://worldchain-mainnet.g.alchemy.com/v2/<KEY>
      rpc: envTrim(process.env.WORLDCHAIN_RPC_URL) || (key ? `https://worldchain-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: envTrim(process.env.WLD_CONTRACT_WORLDCHAIN),
    },
    base: {
      rpc: envTrim(process.env.ALCHEMY_BASE_RPC_URL) || (key ? `https://base-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: envTrim(process.env.WLD_CONTRACT_BASE),
    },
    optimism: {
      rpc: envTrim(process.env.ALCHEMY_OPT_RPC_URL) || (key ? `https://opt-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: envTrim(process.env.WLD_CONTRACT_OPTIMISM),
    },
    ethereum: {
      rpc: envTrim(process.env.ALCHEMY_ETH_RPC_URL) || (key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : ''),
      contract: envTrim(process.env.WLD_CONTRACT_ETHEREUM),
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
    // balance fetched successfully
    const bi = BigInt(raw);
    const denom = BigInt(10) ** BigInt(decimals);
    const whole = Number(bi / denom);
    const frac = Number(bi % denom) / Number(denom);
    const value = whole + frac;
    return { raw, decimals, value, source: network };
  } catch {
    // swallow network errors and try next network
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

// Helper to query Etherscan/Blockscout-compatible API and map to our type
async function getOnchainHistory(address: string, limit = 10): Promise<OnchainTx[]> {
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
        timeStamp?: string; // Etherscan-style
        timestamp?: string; // Some explorers use this
        tokenSymbol?: string;
        tokenDecimal?: string;
      };
      const arr = j.result as ScanTx[];
      const parseTs = (v: unknown) => {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return Date.now();
        // seconds vs milliseconds
        return n < 1e12 ? n * 1000 : n;
      };
      const filtered = contract
        ? arr
        : arr.filter(tx => ((tx.tokenSymbol || '').toUpperCase().includes('WLD')));
      return filtered.map((tx) => ({
        id: tx.hash,
        amount: toNumber(tx.value ?? '0', tx.tokenDecimal),
        to: (tx.to || '').toLowerCase(),
        status: 'success' as const,
        hash: tx.hash,
        timestamp: parseTs(tx.timeStamp ?? tx.timestamp ?? 0),
        reference: undefined,
      }));
    } catch {
      return [];
    }
  };

  // 1) Try World Chain (Worldscan / Blockscout)
  const worldApi = envTrim(process.env.WORLDCHAIN_API_URL) || 'https://api.worldscan.org/api';
  const worldKey = envTrim(process.env.WORLDCHAIN_API_KEY);
  const worldContract = envTrim(process.env.WLD_CONTRACT_WORLDCHAIN);
  if (worldApi) {
    const list = await fetchFrom(worldApi, worldKey || undefined, worldContract || undefined);
    if (list.length > 0) return list;
    // Fallback to Blockscout v2 style if available
    try {
      const base = worldApi.replace(/\/?api\/?$/, '').trim();
      const url = new URL(`${base}/api/v2/addresses/${address}/token-transfers`);
      url.searchParams.set('type', 'ERC-20');
      url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 25)));
      const r = await fetch(url.toString(), { cache: 'no-store' });
      const j = await r.json();
      type BlockscoutV2Token = { address?: string; decimals?: number };
      type BlockscoutV2Item = {
        tx_hash?: string;
        hash?: string;
        to_hash?: string;
        to?: { hash?: string } | string;
        value?: string;
        timestamp?: string;
        token?: BlockscoutV2Token;
      };
      const items: BlockscoutV2Item[] = Array.isArray(j)
        ? (j as BlockscoutV2Item[])
        : Array.isArray((j as { items?: BlockscoutV2Item[] })?.items)
        ? ((j as { items: BlockscoutV2Item[] }).items)
        : [];
      if (items.length > 0) {
        const mapV2 = (it: BlockscoutV2Item): OnchainTx | null => {
          const hash = it?.tx_hash || it?.hash;
          if (!hash) return null;
          const toHash = (() => {
            if (it?.to_hash) return String(it.to_hash);
            const t = it?.to;
            if (typeof t === 'string') return t;
            return t?.hash || '';
          })();
          const val = String(it?.value ?? '0');
          const dec = Number(it?.token?.decimals ?? process.env.WLD_DECIMALS ?? '18');
          const toNumber = (v: string, d: number) => {
            try {
              const n = BigInt(v || '0');
              const denom = BigInt(10) ** BigInt(d);
              const whole = Number(n / denom);
              const frac = Number(n % denom) / Number(denom);
              return whole + frac;
            } catch { return 0; }
          };
          const t = it?.timestamp ? Number(new Date(it.timestamp).getTime()) : Date.now();
          // Filter by contract if provided
          const tokenAddr = (it?.token?.address || '').toLowerCase();
          if (worldContract && tokenAddr && tokenAddr !== worldContract.toLowerCase()) return null;
          return {
            id: String(hash),
            amount: toNumber(val, dec),
            to: String(toHash).toLowerCase(),
            status: 'success',
            hash: String(hash),
            timestamp: t,
            reference: undefined,
          };
        };
        const mapped = items.map(mapV2).filter((x): x is OnchainTx => Boolean(x));
        if (mapped.length > 0) return mapped.slice(0, limit);
      }
    } catch {
      // ignore and continue fallbacks
    }
  }

  // 1.b) Fallback via RPC logs on World Chain (no external indexer)
  try {
    const { map } = networksFromEnv();
    const cfg = map['worldchain'];
    if (cfg.rpc && cfg.contract) {
      const rpc = async <T = unknown>(method: string, params: unknown[]): Promise<T> => {
        const r = await fetch(cfg.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const j = await r.json();
        return j.result as T;
      };
      const latestHex = await rpc<string>('eth_blockNumber', []);
      const latest = parseInt(latestHex, 16);
      const maxSpan = Number(process.env.WORLDCHAIN_LOG_MAX_SPAN_BLOCKS || '3000000');
      const window = Number(process.env.WORLDCHAIN_LOG_WINDOW_BLOCKS || '200000');
      const topicTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const addr32 = '0x' + pad32(toChecksumAddress(address));
      type Log = { blockNumber: string; transactionHash: string; data: string; topics: string[] };
      const gathered: Log[] = [];
      let end = latest;
      const min = Math.max(0, latest - maxSpan);
      while (end > min && gathered.length < limit * 5) { // gather a bit extra for safety
        const start = Math.max(min, end - window + 1);
        const fromHex = '0x' + start.toString(16);
        const toHex = '0x' + end.toString(16);
        try {
          const [logsIn, logsOut] = await Promise.all([
            rpc<Log[]>('eth_getLogs', [{ fromBlock: fromHex, toBlock: toHex, address: cfg.contract, topics: [topicTransfer, null, addr32] }]),
            rpc<Log[]>('eth_getLogs', [{ fromBlock: fromHex, toBlock: toHex, address: cfg.contract, topics: [topicTransfer, addr32, null] }]),
          ]);
          if (Array.isArray(logsIn)) gathered.push(...logsIn);
          if (Array.isArray(logsOut)) gathered.push(...logsOut);
        } catch {}
        end = start - 1;
      }
      const logs: Log[] = gathered;
      if (logs.length > 0) {
        const uniqBlocks = Array.from(new Set(logs.map(l => l.blockNumber))).slice(0, 128);
        const blockTs = new Map<string, number>();
        await Promise.all(uniqBlocks.map(async (bn) => {
          try {
            const b = await rpc<{ timestamp: string }>('eth_getBlockByNumber', [bn, false]);
            if (b?.timestamp) blockTs.set(bn, parseInt(b.timestamp, 16) * 1000);
          } catch {}
        }));
        const dec = Number(process.env.WLD_DECIMALS || '18');
        const denom = BigInt(10) ** BigInt(dec);
        const toNum = (hex: string) => {
          try {
            const n = BigInt(hex);
            const whole = Number(n / denom);
            const frac = Number(n % denom) / Number(denom);
            return whole + frac;
          } catch { return 0; }
        };
        const parseTopicAddr = (t: string) => '0x' + hexStrip(t).slice(24).toLowerCase();
        const dedup = new Map<string, Log>();
        for (const l of logs) {
          dedup.set(l.transactionHash, l);
        }
        const mapped: OnchainTx[] = Array.from(dedup.values()).map((l) => ({
          id: l.transactionHash,
          amount: toNum(l.data || '0x0'),
          to: parseTopicAddr(l.topics?.[2] || '0x'),
          status: 'success' as const,
          hash: l.transactionHash,
          timestamp: blockTs.get(l.blockNumber) || Date.now(),
          reference: undefined,
        }));
        mapped.sort((a, b) => b.timestamp - a.timestamp);
        if (mapped.length > 0) return mapped.slice(0, limit);
      }
    }
  } catch {
    // ignore and continue
  }

  // 1.c) Fallback via Alchemy enhanced API (if supported)
  try {
    const { map } = networksFromEnv();
    const cfg = map['worldchain'];
    if (cfg.rpc && cfg.contract && /alchemy\.com\//i.test(cfg.rpc)) {
      const rpc = async <T = unknown>(method: string, params: unknown[]): Promise<T> => {
        const r = await fetch(cfg.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const j = await r.json();
        return (j.result as T) || ([] as unknown as T);
      };
      type AlchemyTx = {
        hash?: string;
        to?: string;
        from?: string;
        rawContract?: { value?: string };
        blockNum?: string;
      };
      const maxCount = '0x19'; // 25
      const baseParams = {
        fromBlock: '0x0',
        toBlock: 'latest',
        category: ['erc20'],
        contractAddresses: [map['worldchain'].contract],
        withMetadata: false,
        excludeZeroValue: false,
        maxCount,
        order: 'desc',
      } as const;
      const [outRes, inRes] = await Promise.all([
        rpc<{ transfers?: AlchemyTx[] }>('alchemy_getAssetTransfers', [{ ...baseParams, fromAddress: address }]),
        rpc<{ transfers?: AlchemyTx[] }>('alchemy_getAssetTransfers', [{ ...baseParams, toAddress: address }]),
      ]);
      const toNum = (hex?: string) => {
        try {
          const dec = Number(envTrim(process.env.WLD_DECIMALS) || '18');
          const denom = BigInt(10) ** BigInt(dec);
          const v = BigInt(hex || '0x0');
          const whole = Number(v / denom);
          const frac = Number(v % denom) / Number(denom);
          return whole + frac;
        } catch { return 0; }
      };
      // Try to fetch block timestamps for these transfers
      const blocks = Array.from(new Set([...(outRes?.transfers||[]), ...(inRes?.transfers||[])]
        .map(t => t.blockNum)
        .filter(Boolean))) as string[];
      const tsMap = new Map<string, number>();
      try {
        await Promise.all(blocks.map(async (bn) => {
          try {
            const b = await rpc<{ timestamp: string }>('eth_getBlockByNumber', [bn, false]);
            if (b?.timestamp) tsMap.set(bn, parseInt(b.timestamp, 16) * 1000);
          } catch {}
        }));
      } catch {}

      const mapTx = (t: AlchemyTx): OnchainTx | null => {
        const h = t.hash || '';
        if (!h) return null;
        const ts = (t.blockNum && tsMap.get(t.blockNum)) || Date.now();
        return {
          id: h,
          amount: toNum(t.rawContract?.value),
          to: (t.to || '').toLowerCase(),
          status: 'success',
          hash: h,
          timestamp: ts,
          reference: undefined,
        };
      };
      const list = [
        ...(outRes?.transfers || []).map(mapTx).filter(Boolean) as OnchainTx[],
        ...(inRes?.transfers || []).map(mapTx).filter(Boolean) as OnchainTx[],
      ];
      list.sort((a, b) => b.timestamp - a.timestamp);
      if (list.length > 0) return list.slice(0, limit);
    }
  } catch {}

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
  if (optApi) return await fetchFrom(optApi, optKey || undefined, optContract || undefined);
  return [];
}

export { getOnchainHistory };
