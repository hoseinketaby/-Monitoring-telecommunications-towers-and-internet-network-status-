import { Sparkles, ShieldCheck, TrendingUp, Target, Wallet } from "lucide-react";
import { useMonitorStore } from "../store";
import { useI18n } from "../i18n";
import { InvestorROICalculator } from "../components/Investor/InvestorROICalculator";
import { InvestorTAM } from "../components/Investor/InvestorTAM";
import { InvestorMoat } from "../components/Investor/InvestorMoat";
import { InvestorUseOfFunds } from "../components/Investor/InvestorUseOfFunds";
import { InvestorOnePager } from "../components/Investor/InvestorOnePager";

export function Investor() {
  const towers = useMonitorStore((state) => state.towers);
  const events = useMonitorStore((state) => state.events);
  const logs = useMonitorStore((state) => state.networkLogs);
  const { language, t } = useI18n();
  const isFa = language === "fa";

  const offline = towers.filter((t) => t.status === "offline").length;
  const outages = towers.filter((t) => !t.isGridPowerActive).length;
  const batteryRisk = towers.filter((t) => t.batteryLevel < 25).length;
  const total = towers.length || 1;
  const savings = Math.round((offline * 4200) + (outages * 1800) + (batteryRisk * 950));
  const roi = Math.min(420, Math.round((savings / 18000) * 100));
  const readiness = Math.min(100, Math.round(55 + (towers.filter((t) => t.status === "online").length / total) * 30 + Math.min(events.length, 15)));

  const cards = [
    { label: t("savings"), value: `${savings.toLocaleString()} $`, icon: Wallet, color: "text-emerald-300", bg: "from-emerald-950/30 to-emerald-900/10", border: "border-emerald-800/30" },
    { label: t("roi"), value: `${roi}%`, icon: TrendingUp, color: "text-cyan-300", bg: "from-cyan-950/30 to-cyan-900/10", border: "border-cyan-800/30" },
    { label: t("avoidedOutages"), value: outages, icon: ShieldCheck, color: "text-amber-300", bg: "from-amber-950/30 to-amber-900/10", border: "border-amber-800/30" },
    { label: t("readiness"), value: `${readiness}%`, icon: Target, color: "text-violet-300", bg: "from-violet-950/30 to-violet-900/10", border: "border-violet-800/30" },
  ] as const;

  return (
    <section className="investor-page" dir={language === "fa" ? "rtl" : "ltr"}>
      {/* Hero Banner */}
      <div className="investor-hero">
        <div className="investor-hero-glow" />
        <div className="investor-hero-content">
          <p className="investor-hero-eyebrow">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            {isFa ? "داستان سرمایه‌گذاری" : "INVESTOR STORY"}
          </p>
          <h1 className="investor-hero-title">
            {isFa ? "از پایش دکل تا ماشین فروش" : "From Tower Monitor to Sales Machine"}
          </h1>
          <p className="investor-hero-subtitle">
            {isFa
              ? "این نما اپلیکیشن را از یک ابزار مانیتورینگ ساده به یک دارایی سرمایه‌پذیر تبدیل می‌کند: کاهش هزینه عملیات، پیش‌بینی قطعی پیش از وقوع، و عددهایی که در جلسه سرمایه‌گذار می‌توان روی آن‌ها ایستاد."
              : "This view transforms the app from a simple monitoring tool into a fundable asset: lower opex, pre-failure prediction, and numbers you can stand on in any investor meeting."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="investor-kpi-grid">
        {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <article key={label} className={`investor-kpi-card bg-gradient-to-br ${bg} ${border}`}>
            <Icon className={`investor-kpi-icon ${color}`} />
            <p className="investor-kpi-label">{label}</p>
            <b className="investor-kpi-value">{value}</b>
          </article>
        ))}
      </div>

      {/* Main content: two-column layout */}
      <div className="investor-main-grid">
        <InvestorROICalculator />
        <InvestorTAM />
      </div>

      <div className="investor-mid-grid">
        <InvestorMoat />
        <InvestorUseOfFunds />
      </div>

      <InvestorOnePager />

      {/* Bottom CTA */}
      <div className="investor-cta">
        <div className="investor-cta-content">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <p>
            {isFa
              ? "بهترین نقطه برای شروع دمو: یک صفحه که نشان می‌دهد این محصول چطور پول، ریسک، و uptime را همزمان بهبود می‌دهد. اسلایدرهای ROI را حرکت دهید تا سناریوی سرمایه‌گذار را شخصی‌سازی کنید."
              : "Best demo hook: one screen that proves this product improves money, risk, and uptime simultaneously. Drag the ROI sliders to personalize the investor scenario."}
          </p>
        </div>
      </div>
    </section>
  );
}
