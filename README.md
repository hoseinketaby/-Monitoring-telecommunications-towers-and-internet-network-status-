# سامانه پایش هوشمند دکل‌های مخابراتی

اپلیکیشن React/Vite برای پایش وضعیت دکل‌ها، نقشه، تحلیل و دستیار هوش مصنوعی.

## اجرا

```bash
npm install
copy .env.example .env
npm run dev
```

## راه‌اندازی هوش مصنوعی OpenRouter

کلید را فقط در فایل `.env` قرار دهید؛ این فایل در Git نادیده گرفته می‌شود:

```env
OPENROUTER_API_KEY=کلید-خصوصی-شما
OPENROUTER_MODEL=openai/gpt-4o-mini
```

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

کلید با پیشوند `VITE_` استفاده نمی‌شود و هرگز به مرورگر ارسال نمی‌شود؛ درخواست‌ها از سرور به OpenRouter می‌روند.
