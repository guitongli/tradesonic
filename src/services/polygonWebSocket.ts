import type { PolygonCryptoTrade, PolygonMessage, TradeData } from '../types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'error';

export interface PolygonWSCallbacks {
  onTrade: (trade: TradeData) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (error: string) => void;
}

const CRYPTO_WS_URL = 'wss://socket.polygon.io/crypto';

function parseTrade(msg: PolygonCryptoTrade): TradeData {
  return {
    id: msg.i ?? `${msg.t}-${msg.p}`,
    pair: msg.pair,
    price: msg.p,
    size: msg.s,
    timestamp: msg.t,
    exchange: msg.x,
    conditions: msg.c ?? [],
  };
}

export function createPolygonWebSocket(
  apiKey: string,
  symbols: string[],
  callbacks: PolygonWSCallbacks,
) {
  let ws: WebSocket | null = null;
  let intentionallyClosed = false;

  function connect() {
    intentionallyClosed = false;
    callbacks.onStatusChange('connecting');

    ws = new WebSocket(CRYPTO_WS_URL);

    ws.onopen = () => {
      callbacks.onStatusChange('authenticating');
      ws!.send(JSON.stringify({ action: 'auth', params: apiKey }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const messages: PolygonMessage[] = JSON.parse(event.data);

      for (const msg of messages) {
        if (msg.ev === 'status') {
          if (msg.status === 'auth_success') {
            callbacks.onStatusChange('connected');
            // Subscribe to crypto trade channels
            const params = symbols.map((s) => `XT.${s}`).join(',');
            ws!.send(JSON.stringify({ action: 'subscribe', params }));
          } else if (msg.status === 'auth_failed') {
            callbacks.onStatusChange('error');
            callbacks.onError(`Auth failed: ${msg.message}`);
          }
        } else if (msg.ev === 'XT') {
          callbacks.onTrade(parseTrade(msg));
        }
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
