import { useCallback, useEffect, useRef, useState } from 'react';
import { createFinnhubWebSocket } from '../services/finnhubWebSocket';
import { fetchAllSupportResistance } from '../services/finnhubRest';
import type {
  ConnectionStatus,
  FinnhubSupportResistance,
  FinnhubTradeItem,
  TradeData,
} from '../types';

const MAX_ITEMS = 200;

export function useFinnhub(
  symbols: string[],
  onTrade?: (trade: TradeData) => void,
) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [rawTrades, setRawTrades] = useState<FinnhubTradeItem[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [supportResistance, setSupportResistance] = useState<
    Record<string, FinnhubSupportResistance>
  >({});

  const wsRef = useRef<ReturnType<typeof createFinnhubWebSocket> | null>(null);
  const onTradeRef = useRef(onTrade);
  onTradeRef.current = onTrade;

  const connect = useCallback(() => {
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY as string | undefined;
    if (!apiKey) {
      setError('Set VITE_FINNHUB_API_KEY in your .env file');
      setStatus('error');
      return;
    }

    wsRef.current?.disconnect();
    setError(null);
    setTrades([]);
    setRawTrades([]);

    // Fetch support/resistance levels once
    fetchAllSupportResistance(symbols, apiKey).then(setSupportResistance);

    wsRef.current = createFinnhubWebSocket(apiKey, symbols, {
      onTrade: (trade) => {
        setTrades((prev) => [trade, ...prev].slice(0, MAX_ITEMS));
        onTradeRef.current?.(trade);
      },
      onRawTrades: (items) => {
        setRawTrades((prev) => [...items, ...prev].slice(0, MAX_ITEMS));
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

  return {
    trades,
    rawTrades,
    status,
    error,
    supportResistance,
    connect,
    disconnect,
  };
}
