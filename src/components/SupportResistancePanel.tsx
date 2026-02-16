import type { FinnhubSupportResistance } from '../types';

interface Props {
  data: Record<string, FinnhubSupportResistance>;
}

export function SupportResistancePanel({ data }: Props) {
  const symbols = Object.keys(data);

  if (symbols.length === 0) {
    return (
      <div className="border border-gray-800 rounded-lg bg-gray-900/40 p-3">
        <span className="text-xs font-semibold text-gray-200">Support / Resistance</span>
        <p className="text-gray-600 text-xs mt-2">Connect Finnhub to load levels...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/40 overflow-hidden" style={{ borderTopColor: '#f59e0b', borderTopWidth: '2px' }}>
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-200">Support / Resistance (Daily)</span>
      </div>
      <div className="p-3 space-y-3">
        {symbols.map((symbol) => (
          <div key={symbol}>
            <span className="text-[11px] text-gray-400 font-medium">{symbol}</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data[symbol].levels.length > 0 ? (
                data[symbol].levels.map((level, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-mono text-amber-300"
                  >
                    {level.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-600">No levels available</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
