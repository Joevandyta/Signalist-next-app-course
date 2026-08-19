import TradingViewWidget from "@/components/TradingViewWidget";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import WatchlistButton from "@/components/WatchlistButton";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  return (
    <div className="w-full min-h-screen py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            height={600}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-overview.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            height={600}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <WatchlistButton 
              symbol={symbol} 
              company={symbol} 
              isInWatchlist={false} 
            />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </div>
      </div>
    </div>
  );
}
