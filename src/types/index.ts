export interface TradeData {
  id: string;
  pair: string;
  price: number;
  size: number;
  timestamp: number;
  exchange: number;
  conditions: number[];
}

export interface SonificationConfig {
  minFrequency: number;
  maxFrequency: number;
  volume: number;
  enabled: boolean;
}

/** Raw Polygon.io crypto trade WebSocket message */
export interface PolygonCryptoTrade {
  ev: 'XT';
  pair: string;
  p: number;
  s: number;
  t: number;
  x: number;
  c: number[];
  i: string;
  r: number;
}

export interface PolygonStatusMessage {
  ev: 'status';
  status: string;
  message: string;
}

export type PolygonMessage = PolygonCryptoTrade | PolygonStatusMessage;
