# سامانه پایش هوشمند دکل‌های مخابراتی

اپلیکیشن React/Vite برای پایش وضعیت دکل‌ها، نقشه، تحلیل و دستیار هوش مصنوعی.

## اجرا

```bash
npm install
copy .env.example .env
npm run dev
```

## راه‌اندازی هوش مصنوعی OpenRouter

کلید را فقط در فایل `.env.local` (یا `.env` برای اجرای محلی فعلی) قرار دهید؛ این فایل‌ها در Git نادیده گرفته می‌شوند:

```env
OPENROUTER_API_KEY=کلید-خصوصی-شما
OPENROUTER_MODEL=openai/gpt-4o-mini
```

سرور ابتدا `.env.local` و سپس `.env` را می‌خواند. کلید را با پیشوند `VITE_` تعریف نکنید، چون متغیرهای `VITE_` برای مرورگر قابل انتشار هستند.

برای توسعه، API امن و Vite را در دو ترمینال اجرا کنید:

```bash
npm run api
npm run dev
```

برای اجرای نسخه نهایی:

```bash
npm run build
npm start
```

کلید هرگز در کد یا GitHub قرار نمی‌گیرد و به مرورگر ارسال نمی‌شود؛ درخواست‌ها از سرور به OpenRouter می‌روند.

## استقرار در Vercel

در مسیر `Settings → Environment Variables` پروژهٔ Vercel، این متغیرها را برای محیط‌های Production، Preview و Development اضافه کنید:

```env
OPENROUTER_API_KEY=کلید-خصوصی-شما
OPENROUTER_MODEL=openai/gpt-4o-mini
```

پس از ذخیرهٔ متغیرها، پروژه را دوباره Deploy کنید.
