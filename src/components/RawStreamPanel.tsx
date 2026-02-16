import type { ConnectionStatus } from '../types';

interface RawStreamPanelProps {
  title: string;
  status: ConnectionStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  maxHeight?: string;
  accentColor?: string;
  emptyMessage?: string;
}

function formatRow(item: unknown): string {
  return JSON.stringify(item, null, 0);
}

const STATUS_DOT: Record<ConnectionStatus, string> = {
  disconnected: 'bg-gray-500',
  connecting: 'bg-yellow-500',
  connected: 'bg-emerald-500',
  error: 'bg-red-500',
};

export function RawStreamPanel({
  title,
  status,
  data,
  maxHeight = '240px',
  accentColor = '#6366f1',
  emptyMessage = 'Waiting for data...',
}: RawStreamPanelProps) {
  return (
    <div className="flex flex-col border border-gray-800 rounded-lg overflow-hidden bg-gray-900/40">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-800"
        style={{ borderTopColor: accentColor, borderTopWidth: '2px' }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${STATUS_DOT[status]} ${status === 'connected' ? 'animate-pulse' : ''}`}
          />
          <span className="text-xs font-semibold text-gray-200">{title}</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">{data.length} items</span>
      </div>

      {/* Scrolling data log */}
      <div
        className="overflow-y-auto overflow-x-hidden font-mono text-[10px] leading-relaxed"
        style={{ maxHeight }}
      >
        {data.length === 0 ? (
          <p className="text-gray-600 text-center py-4 text-xs">{emptyMessage}</p>
        ) : (
          data.map((item, i) => (
            <div
              key={i}
              className="px-3 py-0.5 border-b border-gray-800/30 text-gray-400 hover:bg-gray-800/40 hover:text-gray-200 transition-colors truncate"
            >
              {formatRow(item)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
