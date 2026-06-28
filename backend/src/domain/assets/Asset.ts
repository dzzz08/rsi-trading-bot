/**
 * Asset reference data for the covered universe.
 *
 * The asset universe is intentionally small and explicit for the MVP. Adding an
 * asset is data, not code — providers map their symbols onto these.
 */
export type AssetClass = 'fx' | 'commodity' | 'index' | 'crypto';

export interface Asset {
  /** Canonical internal symbol, e.g. "EURUSD", "XAUUSD", "NAS100", "BTCUSD". */
  readonly symbol: string;
  readonly displayName: string;
  readonly assetClass: AssetClass;
  /** Quote currency for context (e.g. "USD"). */
  readonly quoteCurrency: string;
}

/** The Phase-1 covered universe (see docs/01-product-spec.md §5). */
export const ASSET_UNIVERSE: readonly Asset[] = [
  // FX
  { symbol: 'EURUSD', displayName: 'EUR/USD', assetClass: 'fx', quoteCurrency: 'USD' },
  { symbol: 'GBPUSD', displayName: 'GBP/USD', assetClass: 'fx', quoteCurrency: 'USD' },
  { symbol: 'USDJPY', displayName: 'USD/JPY', assetClass: 'fx', quoteCurrency: 'JPY' },
  { symbol: 'DXY', displayName: 'US Dollar Index', assetClass: 'fx', quoteCurrency: 'USD' },
  // Commodities
  { symbol: 'XAUUSD', displayName: 'Gold', assetClass: 'commodity', quoteCurrency: 'USD' },
  { symbol: 'WTI', displayName: 'Crude Oil (WTI)', assetClass: 'commodity', quoteCurrency: 'USD' },
  // Indices
  { symbol: 'NAS100', displayName: 'Nasdaq 100', assetClass: 'index', quoteCurrency: 'USD' },
  { symbol: 'SPX', displayName: 'S&P 500', assetClass: 'index', quoteCurrency: 'USD' },
  { symbol: 'DJI', displayName: 'Dow Jones', assetClass: 'index', quoteCurrency: 'USD' },
  { symbol: 'DAX', displayName: 'DAX 40', assetClass: 'index', quoteCurrency: 'EUR' },
  // Crypto
  { symbol: 'BTCUSD', displayName: 'Bitcoin', assetClass: 'crypto', quoteCurrency: 'USD' },
  { symbol: 'ETHUSD', displayName: 'Ethereum', assetClass: 'crypto', quoteCurrency: 'USD' },
];

export function findAsset(symbol: string): Asset | undefined {
  return ASSET_UNIVERSE.find((a) => a.symbol === symbol);
}
