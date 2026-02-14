import type { ConnectionStatus } from '../services/binanceWebSocket';

const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
  disconnected: { label: 'Disconnected', color: 'bg-gray-500' },
  connecting: { label: 'Connecting...', color: 'bg-yellow-500' },
  connected: { label: 'Live', color: 'bg-emerald-500' },
  error: { label: 'Error', color: 'bg-red-500' },
};

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const { label, color } = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-300">
      <span className={`inline-block w-2 h-2 rounded-full ${color} ${status === 'connected' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}
