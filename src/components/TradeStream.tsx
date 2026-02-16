import { useEffect, useRef } from 'react';
import type { FinnhubTradeItem } from '../types';

interface Props {
  trades: FinnhubTradeItem[];
}

/** Track previous price per symbol to determine uptick / downtick. */
const lastPrice: Record<string, number> = {};

function tickDirection(item: FinnhubTradeItem): 'up' | 'down' | 'neutral' {
  const prev = lastPrice[item.s];
  lastPrice[item.s] = item.p;
  if (prev === undefined) return 'neutral';
  if (item.p > prev) return 'up';
  if (item.p < prev) return 'down';
  return 'neutral';
}

const TICK_COLORS = {
  up: 'text-emerald-400 bg-emerald-500/8',
  down: 'text-red-400 bg-red-500/8',
  neutral: 'text-gray-400 bg-transparent',
} as const;

const TICK_INDICATOR = {
  up: '▲',
  down: '▼',
  neutral: '·',
} as const;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TradeStream({ trades }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new trades arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [trades.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="zone-label-dot bg-blue-500" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            The Pulse
          </h2>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">Finnhub Trades</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[60px_80px_1fr_80px_24px] gap-2 px-2 pb-2 text-[10px] text-gray-600 font-medium uppercase tracking-wider border-b border-[#2a2a2a] shrink-0">
        <span>Time</span>
        <span>Symbol</span>
        <span className="text-right">Price</span>
        <span className="text-right">Vol</span>
        <span />
      </div>

      {/* Scrolling rows */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
        {trades.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-10">Waiting for Finnhub trades...</p>
        ) : (
          trades.map((item, i) => {
            const dir = tickDirection(item);
            return (
              <div
                key={`${item.t}-${item.s}-${i}`}
                className={`grid grid-cols-[60px_80px_1fr_80px_24px] gap-2 px-2 py-1.5 text-xs font-mono border-b border-[#1f1f1f] transition-colors ${TICK_COLORS[dir]}`}
              >
                <span className="text-gray-500 text-[10px]">{formatTime(item.t)}</span>
                <span className="text-gray-300 font-semibold text-[11px]">{item.s}</span>
                <span className="text-right tabular-nums">{item.p.toFixed(2)}</span>
                <span className="text-right text-gray-500 tabular-nums">{item.v.toFixed(4)}</span>
                <span className={`text-center text-[10px] ${dir === 'up' ? 'text-emerald-500' : dir === 'down' ? 'text-red-500' : 'text-gray-700'}`}>
                  {TICK_INDICATOR[dir]}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
