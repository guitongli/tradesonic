import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createBinanceWebSocket,
  type ConnectionStatus,
} from '../services/binanceWebSocket';
import type { TradeData } from '../types';

const MAX_TRADES = 200;

export function useTradeStream(symbols: string[]) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReturnType<typeof createBinanceWebSocket> | null>(null);

  const connect = useCallback(() => {
    wsRef.current?.disconnect();
    setError(null);
    setTrades([]);

    wsRef.current = createBinanceWebSocket(symbols, {
      onTrade: (trade) => {
        setTrades((prev) => [trade, ...prev].slice(0, MAX_TRADES));
      },
      onStatusChange: setStatus,
      onError: setError,
    });

    wsRef.current.connect();
  }, [symbols]);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  return { trades, status, error, connect, disconnect };
}
