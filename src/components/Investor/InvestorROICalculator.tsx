import { useMemo, useState } from "react";
import { Calculator, TrendingUp, DollarSign, Zap } from "lucide-react";
import { useMonitorStore } from "../../store";
import { useI18n } from "../../i18n";

export function InvestorROICalculator() {
  const towers = useMonitorStore((state) => state.towers);
  const { language } = useI18n();

  const offline = towers.filter((t) => t.status === "offline").length;
  const batteryRisk = towers.filter((t) => t.batteryLevel < 25).length;
  const gridOut = towers.filter((t) => !t.isGridPowerActive).length;

  const [towerCount, setTowerCount] = useState(20);
  const [costPerOutage, setCostPerOutage] = useState(4200);
  const [subscriptionPerTower, setSubscriptionPerTower] = useState(1800);
  const [deploymentCost, setDeploymentCost] = useState(18000);
  const [outageReduction, setOutageReduction] = useState(65);

  const metrics = useMemo(() => {
    const annualOutages = offline * 12 + gridOut * 6 + batteryRisk * 2;
    const savings = Math.round((annualOutages * costPerOutage * outageReduction) / 100);
    const revenue = Math.round(towerCount * subscriptionPerTower * 12);
    const totalBenefit = savings + revenue;
    const roi = Math.round((totalBenefit / Math.max(1, deploymentCost)) * 100);
    const paybackMonths = Math.round((deploymentCost / Math.max(1, totalBenefit / 12)) * 10) / 10;
    return { annualOutages, savings, revenue, totalBenefit, roi, paybackMonths };
  }, [offline, gridOut, batteryRisk, costPerOutage, outageReduction, towerCount, subscriptionPerTower, deploymentCost]);

  const formatNum = (n: number) => n.toLocaleString();
  const isFa = language === "fa";

  return (
    <article className="investor-card investor-roi-card">
      <div className="investor-card-header">
        <div className="investor-card-icon roi-icon"><Calculator className="h-5 w-5" /></div>
        <div>
          <h2 className="investor-card-title">{isFa ? "محاسبه‌گر بازگشت سرمایه (ROI)" : "ROI Calculator"}</h2>
          <p className="investor-card-subtitle">{isFa ? "اسلایدرها را حرکت دهید تا سناریوی خود را ببینید" : "Drag sliders to model your scenario"}</p>
        </div>
      </div>

      <div className="roi-sliders">
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>{isFa ? "تعداد دکل‌های تحت پوشش" : "Towers under management"}</span>
            <b>{towerCount}</b>
          </div>
          <input type="range" min={5} max={200} step={5} value={towerCount} onChange={(e) => setTowerCount(Number(e.target.value))} className="roi-slider" />
        </div>
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>{isFa ? "میانگین هزینه هر قطعی (دلار)" : "Avg. cost per outage (USD)"}</span>
            <b>${formatNum(costPerOutage)}</b>
          </div>
          <input type="range" min={500} max={25000} step={100} value={costPerOutage} onChange={(e) => setCostPerOutage(Number(e.target.value))} className="roi-slider" />
        </div>
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>{isFa ? "درآمد اشتراک سالانه به ازای هر دکل" : "Annual sub. revenue per tower"}</span>
            <b>${formatNum(subscriptionPerTower)}</b>
          </div>
          <input type="range" min={300} max={12000} step={100} value={subscriptionPerTower} onChange={(e) => setSubscriptionPerTower(Number(e.target.value))} className="roi-slider" />
        </div>
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>{isFa ? "کاهش تخمینی قطعی‌ها (%)" : "Estimated outage reduction (%)"}</span>
            <b>{outageReduction}%</b>
          </div>
          <input type="range" min={10} max={95} step={5} value={outageReduction} onChange={(e) => setOutageReduction(Number(e.target.value))} className="roi-slider roi-slider-accent" />
        </div>
        <div className="roi-slider-group">
          <div className="roi-slider-label">
            <span>{isFa ? "هزینه استقرار اولیه (دلار)" : "Initial deployment cost (USD)"}</span>
            <b>${formatNum(deploymentCost)}</b>
          </div>
          <input type="range" min={2000} max={100000} step={500} value={deploymentCost} onChange={(e) => setDeploymentCost(Number(e.target.value))} className="roi-slider" />
        </div>
      </div>

      <div className="roi-results">
        <div className="roi-result-item">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>{isFa ? "صرفه‌جویی سالانه" : "Annual savings"}</span>
          <b>${formatNum(metrics.savings)}</b>
        </div>
        <div className="roi-result-item">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          <span>{isFa ? "درآمد سالانه" : "Annual revenue"}</span>
          <b>${formatNum(metrics.revenue)}</b>
        </div>
        <div className="roi-result-item roi-result-highlight">
          <Zap className="h-4 w-4 text-amber-300" />
          <span>ROI</span>
          <b className="roi-percent">{metrics.roi}%</b>
        </div>
        <div className="roi-result-item">
          <span>{isFa ? "بازگشت سرمایه" : "Payback period"}</span>
          <b>{isFa ? `${metrics.paybackMonths} ماه` : `${metrics.paybackMonths} mo`}</b>
        </div>
      </div>
    </article>
  );
}
