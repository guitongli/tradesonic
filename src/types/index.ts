// ─── Shared ───
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ─── Binance Spot: aggTrade ───
export interface BinanceAggTrade {
  e: 'aggTrade';
  E: number;
  s: string;
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
}

// ─── Binance Futures: Liquidation ───
export interface BinanceLiquidationOrder {
  s: string;   // Symbol
  S: string;   // Side (BUY/SELL)
  o: string;   // Order type
  f: string;   // Time in force
  q: string;   // Original quantity
  p: string;   // Price
  ap: string;  // Average price
  X: string;   // Order status
  l: string;   // Last filled qty
  z: string;   // Accumulated filled qty
  T: number;   // Trade time
}

export interface BinanceLiquidationEvent {
  e: 'forceOrder';
  E: number;
  o: BinanceLiquidationOrder;
}

// ─── Finnhub: Trade ───
export interface FinnhubTradeItem {
  c: string[];  // Conditions
  p: number;    // Price
  s: string;    // Symbol
  t: number;    // Timestamp (ms)
  v: number;    // Volume
}

export interface FinnhubTradeMessage {
  type: 'trade';
  data: FinnhubTradeItem[];
}

export interface FinnhubPingMessage {
  type: 'ping';
}

export type FinnhubWSMessage = FinnhubTradeMessage | FinnhubPingMessage;

// ─── Finnhub: Support/Resistance (REST) ───
export interface FinnhubSupportResistance {
  levels: number[];
}

// ─── Normalized trade (used by sonification + trade list) ───
export interface TradeData {
  id: string;
  pair: string;
  price: number;
  size: number;
  timestamp: number;
  isBuyerMaker: boolean;
  source: 'binance' | 'finnhub';
}

// ─── Normalized liquidation ───
export interface LiquidationData {
  symbol: string;
  side: string;
  price: number;
  qty: number;
  timestamp: number;
}

// ─── Sonification config ───
export interface SonificationConfig {
  minFrequency: number;
  maxFrequency: number;
  volume: number;
  enabled: boolean;
}
