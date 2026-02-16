import { useEffect, useState } from 'react';
import type { LiquidationData } from '../types';

interface Props {
  liquidations: LiquidationData[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LiquidationMonitor({ liquidations }: Props) {
  const [flash, setFlash] = useState(false);

  // Flash the border when a new liquidation arrives
  useEffect(() => {
    if (liquidations.length === 0) return;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(timer);
  }, [liquidations.length]);

  const latest = liquidations[0] ?? null;

  return (
    <div
      className={`flex flex-col h-full relative transition-all duration-300 ${
        flash ? 'liq-flash-active' : ''
      }`}
      style={{
        // Override the zone border on flash
        borderColor: flash ? '#f97316' : undefined,
        boxShadow: flash ? '0 0 20px rgba(249, 115, 22, 0.3), inset 0 0 20px rgba(249, 115, 22, 0.08)' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`zone-label-dot ${flash ? 'bg-orange-500 animate-ping' : 'bg-orange-500/60'}`} />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Crisis Monitor
          </h2>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">!forceOrder</span>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-4 mb-3 shrink-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums text-orange-400 font-mono">
            {liquidations.length}
          </span>
          <span className="text-[10px] text-gray-600 uppercase">liquidations</span>
        </div>
      </div>

      {/* Latest alert card */}
      {latest && (
        <div className={`rounded-md p-3 mb-3 shrink-0 border transition-colors duration-300 ${
          flash ? 'bg-orange-500/10 border-orange-500/40' : 'bg-[#1f1f1f] border-[#2a2a2a]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">LATEST</span>
            <span className="text-[10px] text-gray-600 font-mono">{formatTime(latest.timestamp)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm">{latest.symbol}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              latest.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {latest.side}
            </span>
            <span className="text-gray-300 font-mono text-sm ml-auto tabular-nums">
              ${latest.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">
            qty: {latest.qty}
          </div>
        </div>
      )}

      {/* Scrolling list */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {liquidations.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">No liquidations yet...</p>
        ) : (
          liquidations.slice(0, 50).map((liq, i) => (
            <div
              key={`${liq.timestamp}-${liq.symbol}-${i}`}
              className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono border-b border-[#1f1f1f]"
            >
              <span className="text-gray-600 w-14 shrink-0">{formatTime(liq.timestamp)}</span>
              <span className="text-gray-300 w-16 shrink-0 font-semibold">{liq.symbol}</span>
              <span className={`w-8 shrink-0 ${liq.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                {liq.side}
              </span>
              <span className="text-gray-400 ml-auto tabular-nums">
                ${liq.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
              <span className="text-gray-600 w-16 text-right tabular-nums">{liq.qty}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
