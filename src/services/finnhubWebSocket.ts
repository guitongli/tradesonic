import type {
  ConnectionStatus,
  FinnhubWSMessage,
  FinnhubTradeItem,
  TradeData,
} from '../types';

export interface FinnhubWSCallbacks {
  onTrade: (trade: TradeData) => void;
  onRawTrades: (items: FinnhubTradeItem[]) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

function parseTrade(item: FinnhubTradeItem): TradeData {
  return {
    id: `${item.s}-${item.t}-${item.p}`,
    pair: item.s,
    price: item.p,
    size: item.v,
    timestamp: item.t,
    isBuyerMaker: false, // Finnhub doesn't distinguish
    source: 'finnhub',
  };
}

export function createFinnhubWebSocket(
  apiKey: string,
  symbols: string[],
  callbacks: FinnhubWSCallbacks,
) {
  let ws: WebSocket | null = null;
  let intentionallyClosed = false;

  function connect() {
    intentionallyClosed = false;
    callbacks.onStatusChange('connecting');

    ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    ws.onopen = () => {
      callbacks.onStatusChange('connected');
      // Subscribe to each symbol
      for (const symbol of symbols) {
        ws!.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg: FinnhubWSMessage = JSON.parse(event.data);

      if (msg.type === 'trade' && msg.data) {
        callbacks.onRawTrades(msg.data);
        for (const item of msg.data) {
          callbacks.onTrade(parseTrade(item));
        }
      }
      // type === 'ping' is just a keep-alive, ignore
    };

    ws.onerror = () => {
      callbacks.onStatusChange('error');
      callbacks.onError('Finnhub WebSocket error');
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
      // Unsubscribe before closing
      for (const symbol of symbols) {
        ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      }
      ws.close();
      ws = null;
    }
    callbacks.onStatusChange('disconnected');
  }

  return { connect, disconnect };
}
