import { useMemo } from 'react';
import { useTradeStream } from './hooks/useTradeStream';
import { useSonification, type SoundMode } from './hooks/useSonification';
import { TradeList } from './components/TradeList';
import { StatusBadge } from './components/StatusBadge';

const SYMBOLS = ['btcusdt'];

const MODE_LABELS: Record<SoundMode, { label: string; desc: string }> = {
  glitch: { label: 'Glitch', desc: 'Alva Noto style — kicks & beeps per trade' },
  ambient: { label: 'Ambient', desc: 'Meditative pads — aggregated every 1.5s' },
};

function App() {
  const symbols = useMemo(() => SYMBOLS, []);
  const { enabled, mode, toggleSound, switchMode, sonifyTrade } =
    useSonification();
  const { trades, status, error, connect, disconnect } = useTradeStream(
    symbols,
    sonifyTrade,
  );

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-10 px-4 gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold">TradeSonic</h1>
        <p className="text-gray-400 mt-1">Real-time BTC/USDT trade sonification</p>
      </div>

      {/* Connection + Sound controls */}
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />

        {!isConnected ? (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-sm"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors text-sm"
          >
            Disconnect
          </button>
        )}

        <button
          onClick={toggleSound}
          className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
            enabled
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {enabled ? 'Sound ON' : 'Sound OFF'}
        </button>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-2">
        {(Object.keys(MODE_LABELS) as SoundMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            title={MODE_LABELS[m].desc}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {MODE_LABELS[m].label}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-2">{MODE_LABELS[mode].desc}</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-300 text-sm max-w-lg">
          {error}
        </div>
      )}

      {isConnected && (
        <p className="text-gray-500 text-xs">
          {trades.length} trades received (showing latest 200)
        </p>
      )}

      <TradeList trades={trades} />
    </div>
  );
}

export default App;
