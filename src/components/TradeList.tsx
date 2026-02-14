import type { TradeData } from '../types';

interface TradeListProps {
  trades: TradeData[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TradeList({ trades }: TradeListProps) {
  if (trades.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        No trades yet. Waiting for data...
      </p>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider border-b border-gray-800">
        <span>Time</span>
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {trades.map((trade, i) => (
          <div
            key={trade.id + '-' + i}
            className="grid grid-cols-4 gap-2 px-4 py-1.5 text-sm border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors"
          >
            <span className="text-gray-400 font-mono text-xs">
              {formatTime(trade.timestamp)}
            </span>
            <span className="text-white font-medium">{trade.pair}</span>
            <span className={`text-right font-mono ${trade.isBuyerMaker ? 'text-red-400' : 'text-emerald-400'}`}>
              ${formatPrice(trade.price)}
            </span>
            <span className="text-right font-mono text-gray-300">
              {trade.size.toFixed(6)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
