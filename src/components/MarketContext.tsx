import type { FinnhubSupportResistance, FinnhubTradeItem } from '../types';

interface Props {
  supportResistance: Record<string, FinnhubSupportResistance>;
  latestPrices: Record<string, number>;
}

/**
 * Find the nearest support (below price) and resistance (above price)
 * from a sorted list of levels.
 */
function findNearestLevels(price: number, levels: number[]): { support: number | null; resistance: number | null } {
  const sorted = [...levels].sort((a, b) => a - b);
  let support: number | null = null;
  let resistance: number | null = null;

  for (const level of sorted) {
    if (level <= price) {
      support = level;
    } else if (resistance === null) {
      resistance = level;
    }
  }

  return { support, resistance };
}

/** Calculate position 0..1 of price between support and resistance. */
function pricePosition(price: number, support: number | null, resistance: number | null): number {
  if (support === null || resistance === null || resistance === support) return 0.5;
  return Math.max(0, Math.min(1, (price - support) / (resistance - support)));
}

interface LevelBarProps {
  symbol: string;
  price: number;
  support: number | null;
  resistance: number | null;
}

function LevelBar({ symbol, price, support, resistance }: LevelBarProps) {
  const pos = pricePosition(price, support, resistance);

  // Color the marker based on proximity to resistance (danger) vs support (safe)
  const markerColor = pos > 0.7 ? 'bg-red-500' : pos < 0.3 ? 'bg-emerald-500' : 'bg-amber-400';

  return (
    <div className="mb-4 last:mb-0">
      {/* Symbol + price */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-200">{symbol}</span>
        <span className="text-xs font-mono text-gray-400 tabular-nums">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Support/Resistance labels */}
      <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 mb-1">
        <span>S: {support !== null ? support.toFixed(2) : '—'}</span>
        <span>R: {resistance !== null ? resistance.toFixed(2) : '—'}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-[#1f1f1f] rounded-full overflow-hidden border border-[#2a2a2a]">
        {/* Gradient fill: green → yellow → red */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: 'linear-gradient(to right, #10b981, #f59e0b, #ef4444)',
          }}
        />
        {/* Price position marker */}
        <div
          className={`absolute top-0 bottom-0 w-1.5 rounded-full ${markerColor} shadow-lg transition-all duration-500`}
          style={{ left: `calc(${pos * 100}% - 3px)` }}
        />
      </div>

      {/* Position percentage */}
      <div className="text-right mt-0.5">
        <span className={`text-[9px] font-mono ${
          pos > 0.7 ? 'text-red-500' : pos < 0.3 ? 'text-emerald-500' : 'text-amber-400'
        }`}>
          {(pos * 100).toFixed(0)}% to resistance
        </span>
      </div>
    </div>
  );
}

export function MarketContext({ supportResistance, latestPrices }: Props) {
  const symbols = Object.keys(supportResistance);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="zone-label-dot bg-violet-500" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            The Context
          </h2>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">S/R Levels</span>
      </div>

      {/* Level bars */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {symbols.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">
            Connect Finnhub to load support/resistance...
          </p>
        ) : (
          symbols.map((symbol) => {
            const price = latestPrices[symbol] ?? 0;
            const { support, resistance } = findNearestLevels(
              price,
              supportResistance[symbol]?.levels ?? [],
            );
            return (
              <LevelBar
                key={symbol}
                symbol={symbol}
                price={price}
                support={support}
                resistance={resistance}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/** Helper: extract latest prices from Finnhub trade items. */
export function extractLatestPrices(trades: FinnhubTradeItem[]): Record<string, number> {
  const prices: Record<string, number> = {};
  // Trades arrive newest-first; first occurrence per symbol is the latest
  for (const t of trades) {
    if (!(t.s in prices)) {
      prices[t.s] = t.p;
    }
  }
  return prices;
}
