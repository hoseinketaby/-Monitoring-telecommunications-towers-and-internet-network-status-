import { useMemo } from "react";
import { Globe, TrendingUp, Target } from "lucide-react";
import { useMonitorStore } from "../../store";
import { useI18n } from "../../i18n";

export function InvestorTAM() {
  const towers = useMonitorStore((state) => state.towers);
  const { language } = useI18n();
  const isFa = language === "fa";

  const tam = useMemo(() => {
    const totalGlobalTowers = 4_200_000;
    const regionalTowers = 850_000;
    const initialTarget = towers.length || 20;
    const tamValue = totalGlobalTowers * 1800;
    const samValue = regionalTowers * 1800;
    const somValue = Math.round(initialTarget * 1800 * 5);
    return { totalGlobalTowers, regionalTowers, initialTarget, tamValue, samValue, somValue };
  }, [towers.length]);

  const formatMoney = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
    return `$${(n / 1000).toFixed(0)}K`;
  };

  const somPct = Math.round((tam.somValue / tam.tamValue) * 10000) / 100;

  return (
    <article className="investor-card investor-tam-card">
      <div className="investor-card-header">
        <div className="investor-card-icon tam-icon"><Globe className="h-5 w-5" /></div>
        <div>
          <h2 className="investor-card-title">{isFa ? "اندازه بازار (TAM / SAM / SOM)" : "Market Size (TAM / SAM / SOM)"}</h2>
          <p className="investor-card-subtitle">{isFa ? "بازار جهانی پایش دکل‌های مخابراتی" : "Global telecom tower monitoring market"}</p>
        </div>
      </div>

      <div className="tam-visual">
        <div className="tam-layer tam-layer-tam">
          <div className="tam-layer-inner">
            <div className="tam-layer-label">TAM</div>
            <div className="tam-layer-value">{formatMoney(tam.tamValue)}</div>
            <div className="tam-layer-desc">{isFa ? `${tam.totalGlobalTowers.toLocaleString()}+ دکل در جهان` : `${tam.totalGlobalTowers.toLocaleString()}+ towers globally`}</div>
          </div>
        </div>
        <div className="tam-layer tam-layer-sam">
          <div className="tam-layer-inner">
            <div className="tam-layer-label">SAM</div>
            <div className="tam-layer-value">{formatMoney(tam.samValue)}</div>
            <div className="tam-layer-desc">{isFa ? `${tam.regionalTowers.toLocaleString()}+ دکل منطقه‌ای` : `${tam.regionalTowers.toLocaleString()}+ regional towers`}</div>
          </div>
        </div>
        <div className="tam-layer tam-layer-som">
          <div className="tam-layer-inner">
            <div className="tam-layer-label">SOM</div>
            <div className="tam-layer-value">{formatMoney(tam.somValue)}</div>
            <div className="tam-layer-desc">{isFa ? `${tam.initialTarget.toLocaleString()} دکل اولیه × ۵ سال` : `${tam.initialTarget.toLocaleString()} initial towers × 5yr`}</div>
          </div>
        </div>
      </div>

      <div className="tam-stats">
        <div className="tam-stat">
          <Globe className="h-3.5 w-3.5 text-sky-300" />
          <span>{isFa ? "رشد سالانه بازار" : "Market CAGR"}</span>
          <b>14.2%</b>
        </div>
        <div className="tam-stat">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          <span>{isFa ? "نفوذ هدف ۵ ساله" : "5-year penetration target"}</span>
          <b>{somPct}%</b>
        </div>
        <div className="tam-stat">
          <Target className="h-3.5 w-3.5 text-amber-300" />
          <span>{isFa ? "دکل‌های بدون پایش" : "Unmonitored towers"}</span>
          <b>~65%</b>
        </div>
      </div>
    </article>
  );
}
