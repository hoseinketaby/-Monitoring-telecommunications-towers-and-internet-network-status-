# سامانه پایش هوشمند دکل‌های مخابراتی

اپلیکیشن React/Vite برای پایش وضعیت دکل‌ها، برق و باتری، آب‌وهوا، نقشه و تحلیل LLM.

## اجرا

```bash
npm install
copy .env.example .env
npm run dev
```

بدون تنظیم متغیرهای محیطی، برنامه به‌صورت خودکار از دادهٔ `src/data/towers.seed.json` استفاده می‌کند و در صورت نبود آن به دادهٔ Mock برمی‌گردد.

## قابلیت‌های اصلی

- زنجیرهٔ داده: API مخابرات → Database → JSON seed → Mock
- واکشی و کش آب‌وهوا از Open-Meteo با حداکثر ۵ درخواست هم‌زمان
- شبیه‌سازی قطعی برق، باتری، سلامت باتری و ریسک آب‌وهوا فقط برای داده‌های محلی/Mock
- LLM قابل‌تغییر بین OpenRouter، GapGPT و AvalAI با fallback و تحلیل rule-based
- داشبورد KPI، نمودار uptime، جدول ریسک، نقشه Leaflet، Agent Feed و خروجی CSV
