import { useMemo } from 'react';
import { useTradeStream } from './hooks/useTradeStream';
import { useSonification } from './hooks/useSonification';
import { TradeList } from './components/TradeList';
import { StatusBadge } from './components/StatusBadge';

const SYMBOLS = ['btcusdt'];

function App() {
  const symbols = useMemo(() => SYMBOLS, []);
  const { ambientOn, glitchOn, toggleAmbient, toggleGlitch, sonifyTrade } =
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

      {/* Connection controls */}
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
      </div>

      {/* Sound mode toggles */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleAmbient}
          className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
            ambientOn
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {ambientOn ? 'Ambient ON' : 'Ambient OFF'}
        </button>

        <button
          onClick={toggleGlitch}
          className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${
            glitchOn
              ? 'bg-violet-600 hover:bg-violet-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {glitchOn ? 'Glitch ON' : 'Glitch OFF'}
        </button>
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
