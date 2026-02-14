import type { BinanceTrade, TradeData } from '../types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WSCallbacks {
  onTrade: (trade: TradeData) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

function formatSymbol(symbol: string): string {
  // Convert "BTC-USD" or "BTC/USDT" style to Binance format "btcusdt"
  return symbol.replace(/[-/]/g, '').toLowerCase();
}

function formatPairDisplay(symbol: string): string {
  // "btcusdt" -> "BTCUSDT"
  return symbol.toUpperCase();
}

function parseTrade(msg: BinanceTrade): TradeData {
  return {
    id: String(msg.t),
    pair: formatPairDisplay(msg.s),
    price: parseFloat(msg.p),
    size: parseFloat(msg.q),
    timestamp: msg.T,
    isBuyerMaker: msg.m,
  };
}

export function createBinanceWebSocket(
  symbols: string[],
  callbacks: WSCallbacks,
) {
  let ws: WebSocket | null = null;
  let intentionallyClosed = false;

  function connect() {
    intentionallyClosed = false;
    callbacks.onStatusChange('connecting');

    // Binance combined stream for multiple symbols
    const streams = symbols.map((s) => `${formatSymbol(s)}@trade`).join('/');
    const url = symbols.length === 1
      ? `wss://stream.binance.com:9443/ws/${streams}`
      : `wss://stream.binance.com:9443/stream?streams=${streams}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      callbacks.onStatusChange('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      const raw = JSON.parse(event.data);
      // Combined stream wraps data in { stream, data }, single stream sends directly
      const msg: BinanceTrade = raw.data ?? raw;

      if (msg.e === 'trade') {
        callbacks.onTrade(parseTrade(msg));
      }
    };

    ws.onerror = () => {
      callbacks.onStatusChange('error');
      callbacks.onError('WebSocket connection error');
    };

    ws.onclose = () => {
      if (!intentionallyClosed) {
        callbacks.onStatusChange('disconnected');
      }
    };
  }

  function disconnect() {
    intentionallyClosed = true;
    if (ws) {
      ws.close();
      ws = null;
    }
    callbacks.onStatusChange('disconnected');
  }

  return { connect, disconnect };
}
