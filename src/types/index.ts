export interface TradeData {
  timestamp: number;
  price: number;
  volume: number;
  side: 'buy' | 'sell';
}

export interface SonificationConfig {
  minFrequency: number;
  maxFrequency: number;
  volume: number;
  enabled: boolean;
}
