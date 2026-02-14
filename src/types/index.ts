export interface TradeData {
  id: string;
  pair: string;
  price: number;
  size: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface SonificationConfig {
  minFrequency: number;
  maxFrequency: number;
  volume: number;
  enabled: boolean;
}

/** Raw Binance trade WebSocket message */
export interface BinanceTrade {
  e: 'trade';
  E: number;
  s: string;
  t: number;
  p: string;
  q: string;
  T: number;
  m: boolean;
}
