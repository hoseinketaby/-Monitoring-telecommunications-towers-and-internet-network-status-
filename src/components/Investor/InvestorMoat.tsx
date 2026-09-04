import { Shield, Cpu, Network, Zap } from "lucide-react";
import { useI18n } from "../../i18n";

const moatItems = [
  {
    icon: Cpu,
    key: "aiEngine",
    titleFa: "موتور هوش مصنوعی پیش‌بینی‌کننده",
    titleEn: "Predictive AI Engine",
    descFa: "تشخیص قطعی برق و خرابی باطری قبل از وقوع با تحلیل داده‌های تاریخی و شرایط جوی",
    descEn: "Pre-outage detection using historical data patterns and weather analysis",
    strength: 92,
  },
  {
    icon: Network,
    key: "multiSource",
    titleFa: "اتصال به چندین منبع داده",
    titleEn: "Multi-source Data Integration",
    descFa: "پشتیبانی از API مخابرات، دیتابیس، JSON و حالت آفلاین برای استقرار در هر شرایطی",
    descEn: "Telecom API, database, JSON, and offline modes for any deployment scenario",
    strength: 88,
  },
  {
    icon: Shield,
    key: "security",
    titleFa: "امنیت و حریم خصوصی داده‌ها",
    titleEn: "Data Security & Privacy",
    descFa: "کلیدهای API هرگز به مرورگر ارسال نمی‌شوند. تمام پردازش‌های حساس سمت سرور انجام می‌شود.",
    descEn: "API keys never reach the browser. All sensitive processing is server-side.",
    strength: 95,
  },
  {
    icon: Zap,
    key: "realtime",
    titleFa: "پایش لحظه‌ای و هشدار خودکار",
    titleEn: "Real-time Monitoring & Auto Alerts",
    descFa: "رفرش خودکار، هشدار تلگرام، و شبیه‌سازی سه‌بعدی تجهیزات برای دید کامل عملیاتی",
    descEn: "Auto-refresh, Telegram alerts, and 3D equipment simulation for full operational visibility",
    strength: 85,
  },
];

export function InvestorMoat() {
  const { language } = useI18n();
  const isFa = language === "fa";

  return (
    <article className="investor-card investor-moat-card">
      <div className="investor-card-header">
        <div className="investor-card-icon moat-icon"><Shield className="h-5 w-5" /></div>
        <div>
          <h2 className="investor-card-title">{isFa ? "مزیت رقابتی و خندق دفاعی" : "Competitive Moat & Defensibility"}</h2>
          <p className="investor-card-subtitle">{isFa ? "چه چیزی این محصول را غیرقابل کپی می‌کند" : "What makes this product hard to replicate"}</p>
        </div>
      </div>

      <div className="moat-grid">
        {moatItems.map((item) => (
          <div key={item.key} className="moat-item">
            <div className="moat-item-top">
              <div className="moat-item-icon"><item.icon className="h-4 w-4" /></div>
              <div className="moat-item-info">
                <h3 className="moat-item-title">{isFa ? item.titleFa : item.titleEn}</h3>
                <p className="moat-item-desc">{isFa ? item.descFa : item.descEn}</p>
              </div>
            </div>
            <div className="moat-strength">
              <div className="moat-strength-bar">
                <div className="moat-strength-fill" style={{ width: `${item.strength}%` }} />
              </div>
              <span className="moat-strength-value">{item.strength}%</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
