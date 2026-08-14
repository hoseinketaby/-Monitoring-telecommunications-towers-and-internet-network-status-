# سامانه پایش هوشمند دکل‌های مخابراتی

اپلیکیشن React/Vite برای پایش وضعیت دکل‌ها، برق و باتری، آب‌وهوا، نقشه و تحلیل LLM.

## اجرا

```bash
npm install
copy .env.example .env
npm run dev
```

## راه‌اندازی هوش مصنوعی GapGPT

کلید جدید GapGPT را فقط در فایل `.env` قرار دهید:

```env
GAPGPT_API_KEY=کلید-خصوصی-شما
GAPGPT_DEFAULT_MODEL=deepseek-chat
```

برای توسعه، API امن و Vite را در دو ترمینال جدا اجرا کنید:

```bash
npm run api
npm run dev
```

برای اجرای نسخهٔ نهایی:

```bash
npm run build
npm start
```

کلید نباید با `VITE_` شروع شود؛ در این حالت در مرورگر قابل مشاهده خواهد بود. انتخاب مدل و درخواست کاربر در رابط کاربری به سرور محلی ارسال می‌شوند و سرور درخواست را به GapGPT می‌فرستد.

بدون تنظیم متغیرهای محیطی، برنامه به‌صورت خودکار از دادهٔ `src/data/towers.seed.json` استفاده می‌کند و در صورت نبود آن به دادهٔ Mock برمی‌گردد.

## قابلیت‌های اصلی

- زنجیرهٔ داده: API مخابرات → Database → JSON seed → Mock
- واکشی و کش آب‌وهوا از Open-Meteo با حداکثر ۵ درخواست هم‌زمان
- شبیه‌سازی قطعی برق، باتری، سلامت باتری و ریسک آب‌وهوا فقط برای داده‌های محلی/Mock
- LLM قابل‌تغییر بین OpenRouter، GapGPT و AvalAI با fallback و تحلیل rule-based
- داشبورد KPI، نمودار uptime، جدول ریسک، نقشه Leaflet، Agent Feed و خروجی CSV
