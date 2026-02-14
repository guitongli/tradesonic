import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPolygonWebSocket,
  type ConnectionStatus,
} from '../services/polygonWebSocket';
import type { TradeData } from '../types';

const MAX_TRADES = 200;

export function usePolygon(symbols: string[]) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReturnType<typeof createPolygonWebSocket> | null>(null);

  const connect = useCallback(() => {
    const envKey = import.meta.env.VITE_POLYGON_API_KEY as string | undefined;
    const apiKey = envKey?.trim() || '';
    console.log('VITE_POLYGON_API_KEY loaded:', apiKey ? `"${apiKey.slice(0, 4)}..." (len=${apiKey.length})` : 'EMPTY');
    console.log('All VITE_ env vars:', JSON.stringify(
      Object.fromEntries(Object.entries(import.meta.env).filter(([k]) => k.startsWith('VITE_')))
    ));
    if (!apiKey || apiKey === 'your_polygon_api_key_here') {
      setError('Set VITE_POLYGON_API_KEY in your .env file. Make sure .env is in the project root (next to package.json) and restart the dev server.');
      setStatus('error');
      return;
    }

    // Clean up any existing connection
    wsRef.current?.disconnect();

    setError(null);
    setTrades([]);

    wsRef.current = createPolygonWebSocket(apiKey, symbols, {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  return { trades, status, error, connect, disconnect };
}
