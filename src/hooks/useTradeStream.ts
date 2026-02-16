import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createBinanceWebSocket,
  createBinanceLiquidationStream,
} from '../services/binanceWebSocket';
import type {
  BinanceAggTrade,
  BinanceLiquidationEvent,
  ConnectionStatus,
  LiquidationData,
  TradeData,
} from '../types';

const MAX_ITEMS = 200;

export function useTradeStream(
  symbols: string[],
  onTrade?: (trade: TradeData) => void,
) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [rawAggTrades, setRawAggTrades] = useState<BinanceAggTrade[]>([]);
  const [liquidations, setLiquidations] = useState<LiquidationData[]>([]);
  const [rawLiquidations, setRawLiquidations] = useState<BinanceLiquidationEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [liqStatus, setLiqStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<ReturnType<typeof createBinanceWebSocket> | null>(null);
  const liqRef = useRef<ReturnType<typeof createBinanceLiquidationStream> | null>(null);
  const onTradeRef = useRef(onTrade);
  onTradeRef.current = onTrade;

  const connect = useCallback(() => {
    wsRef.current?.disconnect();
    liqRef.current?.disconnect();
    setError(null);
    setTrades([]);
    setRawAggTrades([]);
    setLiquidations([]);
    setRawLiquidations([]);

    // aggTrade stream
    wsRef.current = createBinanceWebSocket(symbols, {
      onTrade: (trade) => {
        setTrades((prev) => [trade, ...prev].slice(0, MAX_ITEMS));
        onTradeRef.current?.(trade);
      },
      onRawAggTrade: (msg) => {
        setRawAggTrades((prev) => [msg, ...prev].slice(0, MAX_ITEMS));
      },
      onStatusChange: setStatus,
      onError: setError,
    });

    // Liquidation stream
    liqRef.current = createBinanceLiquidationStream({
      onLiquidation: (liq) => {
        setLiquidations((prev) => [liq, ...prev].slice(0, MAX_ITEMS));
      },
      onRawLiquidation: (msg) => {
        setRawLiquidations((prev) => [msg, ...prev].slice(0, MAX_ITEMS));
      },
      onStatusChange: setLiqStatus,
      onError: (err) => setError((prev) => prev ? `${prev}; ${err}` : err),
    });

    wsRef.current.connect();
    liqRef.current.connect();
  }, [symbols]);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    liqRef.current?.disconnect();
    wsRef.current = null;
    liqRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
      liqRef.current?.disconnect();
    };
  }, []);

  return {
    trades,
    rawAggTrades,
    liquidations,
    rawLiquidations,
    status,
    liqStatus,
    error,
    connect,
    disconnect,
  };
}
