import { useEffect, useRef } from 'react';
import type { BinanceAggTrade } from '../types';

interface Props {
  trades: BinanceAggTrade[];
}

/** Clamp a value between min and max. */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Map quantity to a glow intensity level 0-1.
 * Small trades ~0.001 BTC → near 0, whale trades >1 BTC → near 1.
 */
function qtyToIntensity(q: string): number {
  const qty = parseFloat(q);
  // log scale: log(0.001)≈-6.9, log(2)≈0.69 → normalized to 0..1
  const raw = (Math.log10(qty) + 3) / 3.3;
  return clamp(raw, 0, 1);
}

export function HighFrequencyPulse({ trades }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<BinanceAggTrade | null>(null);

  // Track the latest trade for the background glow
  useEffect(() => {
    if (trades.length > 0) {
      latestRef.current = trades[0];
    }
  }, [trades]);

  const latest = trades[0] ?? null;
  const intensity = latest ? qtyToIntensity(latest.q) : 0;

  // Dynamic glow color based on direction and intensity
  const isBuy = latest ? !latest.m : true;
  const glowColor = isBuy
    ? `rgba(16, 185, 129, ${intensity * 0.4})`   // emerald for buy
    : `rgba(239, 68, 68, ${intensity * 0.4})`;    // red for sell

  // Show ~last 40 trades as mini bars
  const visible = trades.slice(0, 60);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full relative overflow-hidden transition-shadow duration-300"
      style={{
        boxShadow: intensity > 0.1 ? `inset 0 0 ${30 + intensity * 40}px ${glowColor}` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="zone-label-dot bg-amber-500" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            The Heartbeat
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {latest && (
            <span className={`text-sm font-mono font-bold tabular-nums ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
              ${parseFloat(latest.p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          <span className="text-[10px] text-gray-600 font-mono">BTC aggTrade</span>
        </div>
      </div>

      {/* Pulse bar visualization */}
      <div className="flex-1 flex items-end gap-px min-h-0 z-10 relative">
        {visible.length === 0 ? (
          <p className="text-gray-600 text-xs w-full text-center self-center">Waiting for BTC trades...</p>
        ) : (
          visible.map((trade, i) => {
            const qty = parseFloat(trade.q);
            const h = clamp(qty * 800, 4, 100); // scale height 4-100%
            const isAggressiveBuy = !trade.m;
            const opacity = clamp(1 - i * 0.015, 0.15, 1);
            return (
              <div
                key={`${trade.a}-${i}`}
                className="flex-1 min-w-0 rounded-t-sm transition-all duration-150"
                style={{
                  height: `${h}%`,
                  backgroundColor: isAggressiveBuy
                    ? `rgba(16, 185, 129, ${opacity})`
                    : `rgba(239, 68, 68, ${opacity})`,
                }}
              />
            );
          })
        )}
      </div>

      {/* Metadata bar */}
      {latest && (
        <div className="flex items-center justify-between mt-1 shrink-0 z-10 relative text-[9px] text-gray-600 font-mono">
          <span>qty: {parseFloat(latest.q).toFixed(5)}</span>
          <span>{isBuy ? 'BUY' : 'SELL'}</span>
          <span>intensity: {(intensity * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
