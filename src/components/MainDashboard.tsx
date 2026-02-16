import type { BinanceAggTrade, FinnhubTradeItem, LiquidationData, FinnhubSupportResistance } from '../types';
import { TradeStream } from './TradeStream';
import { HighFrequencyPulse } from './HighFrequencyPulse';
import { LiquidationMonitor } from './LiquidationMonitor';
import { MarketContext, extractLatestPrices } from './MarketContext';
import { useMemo } from 'react';

interface Props {
  finnhubTrades: FinnhubTradeItem[];
  binanceAggTrades: BinanceAggTrade[];
  liquidations: LiquidationData[];
  supportResistance: Record<string, FinnhubSupportResistance>;
}

export function MainDashboard({
  finnhubTrades,
  binanceAggTrades,
  liquidations,
  supportResistance,
}: Props) {
  const latestPrices = useMemo(
    () => extractLatestPrices(finnhubTrades),
    [finnhubTrades],
  );

  return (
    <div className="bento-grid">
      {/* Zone A – The Pulse: Finnhub trade stream (left column, full height) */}
      <div className="bento-zone zone-a">
        <TradeStream trades={finnhubTrades} />
      </div>

      {/* Zone C – Crisis Monitor: Liquidations (top-right) */}
      <div className="bento-zone zone-c">
        <LiquidationMonitor liquidations={liquidations} />
      </div>

      {/* Zone D – The Context: S/R Levels (bottom-right) */}
      <div className="bento-zone zone-d">
        <MarketContext
          supportResistance={supportResistance}
          latestPrices={latestPrices}
        />
      </div>

      {/* Zone B – The Heartbeat: Binance high-frequency pulse (bottom, full width) */}
      <div className="bento-zone zone-b">
        <HighFrequencyPulse trades={binanceAggTrades} />
      </div>
    </div>
  );
}
