import { useMemo } from 'react';
import { useTradeStream } from './hooks/useTradeStream';
import { useFinnhub } from './hooks/useFinnhub';
import { useSonification } from './hooks/useSonification';
import { StatusBadge } from './components/StatusBadge';
import { VolumeSlider } from './components/VolumeSlider';
import { MainDashboard } from './components/MainDashboard';

const BINANCE_SYMBOLS = ['btcusdt'];
const FINNHUB_SYMBOLS = ['AAPL', 'TSLA', 'OANDA:EUR_USD'];

function App() {
  const binanceSymbols = useMemo(() => BINANCE_SYMBOLS, []);
  const finnhubSymbols = useMemo(() => FINNHUB_SYMBOLS, []);

  const {
    ambientOn,
    glitchOn,
    ambientVol,
    glitchVol,
    toggleAmbient,
    toggleGlitch,
    setAmbientVolume,
    setGlitchVolume,
    sonifyTrade,
  } = useSonification();

  const {
    rawAggTrades,
    liquidations,
    status: binanceStatus,
    error: binanceError,
    connect: connectBinance,
    disconnect: disconnectBinance,
  } = useTradeStream(binanceSymbols, sonifyTrade);

  const {
    rawTrades: finnhubRawTrades,
    status: finnhubStatus,
    error: finnhubError,
    supportResistance,
    connect: connectFinnhub,
    disconnect: disconnectFinnhub,
  } = useFinnhub(finnhubSymbols);

  const binanceConnected = binanceStatus === 'connected';
  const binanceConnecting = binanceStatus === 'connecting';
  const finnhubConnected = finnhubStatus === 'connected';
  const finnhubConnecting = finnhubStatus === 'connecting';

  function connectAll() {
    connectBinance();
    connectFinnhub();
  }

  function disconnectAll() {
    disconnectBinance();
    disconnectFinnhub();
  }

  const anyConnected = binanceConnected || finnhubConnected;
  const anyConnecting = binanceConnecting || finnhubConnecting;

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* ─── Top bar: branding + connections + mixer ─── */}
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b border-[#1a1a1a]">
        {/* Left: brand + connections */}
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-wide text-gray-200">
            TRADE<span className="text-blue-500">SONIC</span>
          </h1>

          <div className="flex items-center gap-1.5 text-[10px]">
            <StatusBadge status={binanceStatus} />
            {!binanceConnected ? (
              <button onClick={connectBinance} disabled={binanceConnecting} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-[10px]">
                {binanceConnecting ? '...' : 'Binance'}
              </button>
            ) : (
              <button onClick={disconnectBinance} className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800/60 rounded text-[10px] text-red-300">
                Stop
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <StatusBadge status={finnhubStatus} />
            {!finnhubConnected ? (
              <button onClick={connectFinnhub} disabled={finnhubConnecting} className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-[10px]">
                {finnhubConnecting ? '...' : 'Finnhub'}
              </button>
            ) : (
              <button onClick={disconnectFinnhub} className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800/60 rounded text-[10px] text-red-300">
                Stop
              </button>
            )}
          </div>

          {!anyConnected ? (
            <button onClick={connectAll} disabled={anyConnecting} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-[10px] font-semibold">
              Connect All
            </button>
          ) : (
            <button onClick={disconnectAll} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-[10px] font-semibold">
              Stop All
            </button>
          )}

          {/* Errors */}
          {(binanceError || finnhubError) && (
            <span className="text-[10px] text-red-400 max-w-[200px] truncate">
              {binanceError || finnhubError}
            </span>
          )}
        </div>

        {/* Right: sound mixer */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAmbient}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
              ambientOn ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
            }`}
          >
            AMB
          </button>
          <div className="w-24">
            <VolumeSlider label="" value={ambientVol} onChange={setAmbientVolume} accentColor="#d97706" />
          </div>

          <button
            onClick={toggleGlitch}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
              glitchOn ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
            }`}
          >
            GLT
          </button>
          <div className="w-24">
            <VolumeSlider label="" value={glitchVol} onChange={setGlitchVolume} accentColor="#7c3aed" />
          </div>
        </div>
      </header>

      {/* ─── Bento grid dashboard ─── */}
      <main className="flex-1 p-3 min-h-0">
        <MainDashboard
          finnhubTrades={finnhubRawTrades}
          binanceAggTrades={rawAggTrades}
          liquidations={liquidations}
          supportResistance={supportResistance}
        />
      </main>
    </div>
  );
}

export default App;
