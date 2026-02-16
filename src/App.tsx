import { useMemo } from 'react';
import { useTradeStream } from './hooks/useTradeStream';
import { useFinnhub } from './hooks/useFinnhub';
import { useSonification } from './hooks/useSonification';
import { TradeList } from './components/TradeList';
import { StatusBadge } from './components/StatusBadge';
import { VolumeSlider } from './components/VolumeSlider';
import { RawStreamPanel } from './components/RawStreamPanel';
import { SupportResistancePanel } from './components/SupportResistancePanel';

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
    trades: binanceTrades,
    rawAggTrades,
    liquidations,
    rawLiquidations,
    status: binanceStatus,
    liqStatus,
    error: binanceError,
    connect: connectBinance,
    disconnect: disconnectBinance,
  } = useTradeStream(binanceSymbols, sonifyTrade);

  const {
    trades: finnhubTrades,
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-8 px-4 gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold">TradeSonic</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Multi-source real-time trade data + sonification
        </p>
      </div>

      {/* ─── Connection controls ─── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800">
          <span className="text-[11px] text-gray-500 font-medium">Binance</span>
          <StatusBadge status={binanceStatus} />
          {!binanceConnected ? (
            <button onClick={connectBinance} disabled={binanceConnecting} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 rounded text-xs font-medium">
              {binanceConnecting ? '...' : 'Connect'}
            </button>
          ) : (
            <button onClick={disconnectBinance} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium">
              Stop
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800">
          <span className="text-[11px] text-gray-500 font-medium">Finnhub</span>
          <StatusBadge status={finnhubStatus} />
          {!finnhubConnected ? (
            <button onClick={connectFinnhub} disabled={finnhubConnecting} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 rounded text-xs font-medium">
              {finnhubConnecting ? '...' : 'Connect'}
            </button>
          ) : (
            <button onClick={disconnectFinnhub} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium">
              Stop
            </button>
          )}
        </div>

        {!anyConnected ? (
          <button onClick={connectAll} disabled={anyConnecting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 rounded-lg text-sm font-medium">
            Connect All
          </button>
        ) : (
          <button onClick={disconnectAll} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium">
            Stop All
          </button>
        )}
      </div>

      {/* Errors */}
      {(binanceError || finnhubError) && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2 text-red-300 text-sm max-w-2xl">
          {binanceError && <p>Binance: {binanceError}</p>}
          {finnhubError && <p>Finnhub: {finnhubError}</p>}
        </div>
      )}

      {/* ─── Sound mixer ─── */}
      <div className="w-full max-w-md flex flex-col gap-3 bg-gray-900/50 rounded-xl p-4 border border-gray-800">
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Sound Mixer</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAmbient}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors text-sm shrink-0 ${ambientOn ? 'bg-amber-600 hover:bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {ambientOn ? 'Ambient ON' : 'Ambient OFF'}
          </button>
          <VolumeSlider label="" value={ambientVol} onChange={setAmbientVolume} accentColor="#d97706" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleGlitch}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors text-sm shrink-0 ${glitchOn ? 'bg-violet-600 hover:bg-violet-500' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {glitchOn ? 'Glitch ON' : 'Glitch OFF'}
          </button>
          <VolumeSlider label="" value={glitchVol} onChange={setGlitchVolume} accentColor="#7c3aed" />
        </div>
      </div>

      {/* ─── Raw data streams grid ─── */}
      <div className="w-full max-w-6xl">
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Raw Data Streams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <RawStreamPanel
            title="Binance aggTrade (BTCUSDT)"
            status={binanceStatus}
            data={rawAggTrades}
            accentColor="#f59e0b"
          />
          <RawStreamPanel
            title="Binance Liquidations (!forceOrder)"
            status={liqStatus}
            data={rawLiquidations}
            accentColor="#ef4444"
            emptyMessage="Waiting for liquidations..."
          />
          <RawStreamPanel
            title={`Finnhub Trades (${FINNHUB_SYMBOLS.join(', ')})`}
            status={finnhubStatus}
            data={finnhubRawTrades}
            accentColor="#3b82f6"
          />
          <SupportResistancePanel data={supportResistance} />
        </div>
      </div>

      {/* ─── Parsed trade lists ─── */}
      <div className="w-full max-w-6xl">
        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Binance Trades ({binanceTrades.length})
        </h2>
        <TradeList trades={binanceTrades} />
      </div>

      {finnhubTrades.length > 0 && (
        <div className="w-full max-w-6xl">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Finnhub Trades ({finnhubTrades.length})
          </h2>
          <TradeList trades={finnhubTrades} />
        </div>
      )}

      {liquidations.length > 0 && (
        <div className="w-full max-w-6xl">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Liquidations ({liquidations.length})
          </h2>
          <div className="max-h-[30vh] overflow-y-auto border border-gray-800 rounded-lg">
            {liquidations.map((liq, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-1.5 text-sm border-b border-gray-800/50">
                <span className="text-gray-400 font-mono text-xs">
                  {new Date(liq.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className="text-white font-medium">{liq.symbol}</span>
                <span className={`text-right font-mono ${liq.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {liq.side} ${liq.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-right font-mono text-gray-300">{liq.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
