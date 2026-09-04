import { FileText, Download, Eye } from "lucide-react";
import { useMonitorStore } from "../../store";
import { useI18n } from "../../i18n";

export function InvestorOnePager() {
  const towers = useMonitorStore((state) => state.towers);
  const events = useMonitorStore((state) => state.events);
  const { language } = useI18n();
  const isFa = language === "fa";

  const online = towers.filter((t) => t.status === "online").length;
  const total = towers.length || 1;
  const uptime = Math.round((online / total) * 100);
  const outages = towers.filter((t) => !t.isGridPowerActive).length;
  const batteryLow = towers.filter((t) => t.batteryLevel < 25).length;
  const savings = (towers.filter((t) => t.status === "offline").length * 4200) + (outages * 1800) + (batteryLow * 950);
  const roi = Math.min(420, Math.round((savings / 18000) * 100));

  const exportPDF = () => window.print();

  return (
    <article className="investor-card investor-onepager-card">
      <div className="investor-card-header">
        <div className="investor-card-icon onepager-icon"><FileText className="h-5 w-5" /></div>
        <div>
          <h2 className="investor-card-title">{isFa ? "خلاصه اجرایی یک‌صفحه‌ای" : "Executive One-Pager"}</h2>
          <p className="investor-card-subtitle">{isFa ? "همه چیزهایی که یک سرمایه‌گذار باید بداند" : "Everything an investor needs to know"}</p>
        </div>
        <button onClick={exportPDF} className="onepager-export-btn">
          <Download className="h-3.5 w-3.5" />
          <span>{isFa ? "خروجی PDF" : "Export PDF"}</span>
        </button>
      </div>

      <div className="onepager-grid">
        <div className="onepager-section">
          <span className="onepager-label">{isFa ? "مشکل" : "Problem"}</span>
          <p className="onepager-text">
            {isFa
              ? "اپراتورهای مخابراتی سالانه میلیون‌ها دلار از قطعی‌های پیش‌بینی‌نشده برق و خرابی باطری ضرر می‌کنند. بیش از ۶۵٪ دکل‌ها فاقد سیستم پایش هوشمند هستند."
              : "Telecom operators lose millions annually from unpredicted power outages and battery failures. Over 65% of towers lack intelligent monitoring."}
          </p>
        </div>
        <div className="onepager-section">
          <span className="onepager-label">{isFa ? "راه‌حل" : "Solution"}</span>
          <p className="onepager-text">
            {isFa
              ? "یک لایه تصمیم‌یار هوشمند روی شبکه: پیش‌بینی قطعی با هوش مصنوعی، شبیه‌سازی سه‌بعدی تجهیزات، و هشدار خودکار قبل از وقوع خرابی."
              : "An intelligent decision layer on top of the network: AI-powered outage prediction, 3D equipment simulation, and automated alerts before failure."}
          </p>
        </div>
        <div className="onepager-section onepager-metrics">
          <span className="onepager-label">{isFa ? "اعداد کلیدی (زنده)" : "Key Metrics (Live)"}</span>
          <div className="onepager-kpis">
            <div className="onepager-kpi"><b>{total}</b><span>{isFa ? "دکل" : "Towers"}</span></div>
            <div className="onepager-kpi"><b>{uptime}%</b><span>{isFa ? "پایداری" : "Uptime"}</span></div>
            <div className="onepager-kpi"><b>{roi}%</b><span>ROI</span></div>
            <div className="onepager-kpi"><b>${savings.toLocaleString()}</b><span>{isFa ? "صرفه‌جویی" : "Savings"}</span></div>
          </div>
        </div>
        <div className="onepager-section">
          <span className="onepager-label">{isFa ? "مدل درآمدی" : "Business Model"}</span>
          <p className="onepager-text">
            {isFa
              ? "اشتراک ماهانه به ازای هر دکل (B2B SaaS) + هزینه استقرار یکباره. مدل freemium برای جذب اولیه با upselling به پلن‌های سازمانی."
              : "Monthly per-tower subscription (B2B SaaS) + one-time deployment fee. Freemium tier for initial adoption with enterprise upsell."}
          </p>
        </div>
        <div className="onepager-section">
          <span className="onepager-label">{isFa ? "درخواست سرمایه‌گذاری" : "The Ask"}</span>
          <p className="onepager-text onepager-ask">
            {isFa
              ? "۱۸۰,۰۰۰ دلار (دور Seed) برای ۱۲ ماه توسعه محصول، گسترش تیم، و جذب ۲۰ مشتری اولیه سازمانی."
              : "$180,000 Seed round for 12 months of product development, team growth, and 20 initial enterprise customers."}
          </p>
        </div>
        <div className="onepager-section onepager-traction">
          <span className="onepager-label">{isFa ? "کشش فعلی" : "Current Traction"}</span>
          <div className="onepager-traction-items">
            <span><Eye className="h-3.5 w-3.5 inline text-cyan-300" /> {isFa ? `${events.length} رویداد پایش شده` : `${events.length} monitored events`}</span>
            <span><Eye className="h-3.5 w-3.5 inline text-emerald-300" /> {isFa ? "پشتیبانی از ۳ منبع داده مختلف" : "3 data source integrations"}</span>
            <span><Eye className="h-3.5 w-3.5 inline text-amber-300" /> {isFa ? "داشبورد فارسی/انگلیسی" : "Bilingual dashboard (FA/EN)"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
