import { PieChart, Wallet, Code, Users, Rocket } from "lucide-react";
import { useI18n } from "../../i18n";

const fundCategories = [
  { key: "engineering", labelFa: "توسعه محصول و مهندسی", labelEn: "Product & Engineering", pct: 42, color: "#38bdf8" },
  { key: "sales", labelFa: "فروش و توسعه بازار", labelEn: "Sales & Market Development", pct: 24, color: "#34d399" },
  { key: "team", labelFa: "استخدام و گسترش تیم", labelEn: "Hiring & Team Growth", pct: 18, color: "#a78bfa" },
  { key: "ops", labelFa: "زیرساخت و عملیات", labelEn: "Infrastructure & Operations", pct: 10, color: "#fbbf24" },
  { key: "reserve", labelFa: "ذخیره استراتژیک", labelEn: "Strategic Reserve", pct: 6, color: "#fb7185" },
];

const milestones = [
  { month: 1, textFa: "تکمیل MVP و تست با ۳ اپراتور", textEn: "MVP complete, pilot with 3 operators" },
  { month: 3, textFa: "راه‌اندازی فروش سازمانی و ۲۰ مشتری", textEn: "Enterprise sales launch, 20 customers" },
  { month: 6, textFa: "۱۰۰ دکل فعال و یکپارچگی API", textEn: "100 active towers, API integration" },
  { month: 12, textFa: "رسیدن به نقطه سربه‌سر و ۵۰۰ دکل", textEn: "Break-even, 500 towers under management" },
];

export function InvestorUseOfFunds() {
  const { language } = useI18n();
  const isFa = language === "fa";

  return (
    <article className="investor-card investor-funds-card">
      <div className="investor-card-header">
        <div className="investor-card-icon funds-icon"><Wallet className="h-5 w-5" /></div>
        <div>
          <h2 className="investor-card-title">{isFa ? "نحوه مصرف سرمایه" : "Use of Funds"}</h2>
          <p className="investor-card-subtitle">{isFa ? "تخصیص سرمایه و نقاط عطف ۱۲ ماهه" : "Capital allocation & 12-month milestones"}</p>
        </div>
      </div>

      <div className="funds-layout">
        <div className="funds-chart">
          <svg viewBox="0 0 200 200" className="funds-donut" aria-label={isFa ? "نمودار تخصیص سرمایه" : "Fund allocation chart"}>
            {(() => {
              let cumulative = 0;
              return fundCategories.map((cat) => {
                const startAngle = (cumulative / 100) * 360;
                cumulative += cat.pct;
                const endAngle = (cumulative / 100) * 360;
                const r = 70;
                const cx = 100, cy = 100;
                const x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);
                const large = (cat.pct > 50) ? 1 : 0;
                return (
                  <path
                    key={cat.key}
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                    fill={cat.color}
                    stroke="#121a24"
                    strokeWidth="2"
                    className="funds-slice"
                  />
                );
              });
            })()}
            <circle cx="100" cy="100" r="42" fill="#0b1017" />
            <text x="100" y="96" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="bold">$180K</text>
            <text x="100" y="113" textAnchor="middle" fill="#94a3b8" fontSize="9">{isFa ? "دور seed" : "Seed round"}</text>
          </svg>
        </div>

        <div className="funds-legend">
          {fundCategories.map((cat) => (
            <div key={cat.key} className="funds-legend-item">
              <span className="funds-legend-dot" style={{ background: cat.color }} />
              <span className="funds-legend-label">{isFa ? cat.labelFa : cat.labelEn}</span>
              <b className="funds-legend-pct">{cat.pct}%</b>
            </div>
          ))}
        </div>
      </div>

      <div className="funds-milestones">
        <h3 className="funds-milestones-title">{isFa ? "نقاط عطف ۱۲ ماهه" : "12-Month Milestones"}</h3>
        <div className="funds-timeline">
          {milestones.map((m, i) => (
            <div key={m.month} className="funds-timeline-item">
              <div className="funds-timeline-marker" style={{ animationDelay: `${i * 0.15}s` }}>
                <span>{isFa ? `ماه ${m.month}` : `Mo ${m.month}`}</span>
              </div>
              <p className="funds-timeline-text">{isFa ? m.textFa : m.textEn}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
