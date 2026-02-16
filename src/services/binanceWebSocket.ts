import type {
  BinanceAggTrade,
  BinanceLiquidationEvent,
  ConnectionStatus,
  LiquidationData,
  TradeData,
} from '../types';

export interface BinanceWSCallbacks {
  onTrade: (trade: TradeData) => void;
  onRawAggTrade: (msg: BinanceAggTrade) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

export interface BinanceLiqCallbacks {
  onLiquidation: (liq: LiquidationData) => void;
  onRawLiquidation: (msg: BinanceLiquidationEvent) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

function formatSymbol(symbol: string): string {
  return symbol.replace(/[-/]/g, '').toLowerCase();
}

function parseAggTrade(msg: BinanceAggTrade): TradeData {
  return {
    id: String(msg.a),
    pair: msg.s.toUpperCase(),
    price: parseFloat(msg.p),
    size: parseFloat(msg.q),
    timestamp: msg.T,
    isBuyerMaker: msg.m,
    source: 'binance',
  };
}

function parseLiquidation(msg: BinanceLiquidationEvent): LiquidationData {
  return {
    symbol: msg.o.s,
    side: msg.o.S,
    price: parseFloat(msg.o.p),
    qty: parseFloat(msg.o.q),
    timestamp: msg.o.T,
  };
}

// ─── Spot aggTrade stream ───
export function createBinanceWebSocket(
  symbols: string[],
  callbacks: BinanceWSCallbacks,
) {
  let ws: WebSocket | null = null;
  let intentionallyClosed = false;

  function connect() {
    intentionallyClosed = false;
    callbacks.onStatusChange('connecting');

    const streams = symbols.map((s) => `${formatSymbol(s)}@aggTrade`).join('/');
    const url = symbols.length === 1
      ? `wss://stream.binance.com:9443/ws/${streams}`
      : `wss://stream.binance.com:9443/stream?streams=${streams}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      callbacks.onStatusChange('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      const raw = JSON.parse(event.data);
      const msg: BinanceAggTrade = raw.data ?? raw;

      if (msg.e === 'aggTrade') {
        callbacks.onRawAggTrade(msg);
        callbacks.onTrade(parseAggTrade(msg));
      }
    };

    ws.onerror = () => {
      callbacks.onStatusChange('error');
      callbacks.onError('Binance aggTrade WebSocket error');
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

// ─── Futures liquidation stream ───
export function createBinanceLiquidationStream(callbacks: BinanceLiqCallbacks) {
  let ws: WebSocket | null = null;
  let intentionallyClosed = false;

  function connect() {
    intentionallyClosed = false;
    callbacks.onStatusChange('connecting');

    ws = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');

    ws.onopen = () => {
      callbacks.onStatusChange('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg: BinanceLiquidationEvent = JSON.parse(event.data);

      if (msg.e === 'forceOrder') {
        callbacks.onRawLiquidation(msg);
        callbacks.onLiquidation(parseLiquidation(msg));
      }
    };

    ws.onerror = () => {
      callbacks.onStatusChange('error');
      callbacks.onError('Binance liquidation WebSocket error');
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
