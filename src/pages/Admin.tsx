import { useState } from 'react'
import { BellRing, BookOpen, Send, ShieldCheck, X } from 'lucide-react'
import { useMonitorStore } from '../store'
import { useI18n } from '../i18n'

export function Admin() {
  const towers = useMonitorStore((state) => state.towers)
  const { language } = useI18n()
  const fa = language === 'fa'
  const [token, setToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const sendStatus = async () => {
    setSending(true); setStatus('')
    try {
      const response = await fetch('/api/admin/telegram/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, chatId, towers }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Telegram delivery failed')
      setStatus(fa ? 'وضعیت شبکه با موفقیت ارسال شد.' : 'Status delivered successfully.')
    } catch (error) { setStatus(error instanceof Error ? error.message : fa ? 'ارسال پیام تلگرام ناموفق بود.' : 'Telegram delivery failed') } finally { setSending(false) }
  }
  return <main className="mx-auto max-w-2xl space-y-6 py-10" dir={fa ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.25em] text-cyan-300">{fa ? 'مرکز کنترل مدیریت' : 'ADMIN CONTROL CENTER'}</p><h1 className="mt-2 text-3xl font-bold">{fa ? 'ارسال وضعیت در تلگرام' : 'Telegram status delivery'}</h1><p className="mt-2 text-slate-400">{fa ? 'خلاصه زنده شبکه را با استفاده از توکن BotFather مستقیماً برای مدیر ارسال کنید.' : 'Send a live network summary directly to the manager’s Telegram chat using a BotFather token.'}</p></div><button type="button" onClick={() => setShowGuide(true)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-800 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-950/50"><BookOpen className="h-4 w-4" />{fa ? 'دستورالعمل اتصال' : 'Connection guide'}</button></div>
    <section className="rounded-2xl border border-line bg-panel p-6 shadow-2xl shadow-cyan-950/20">
      <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-300" /><div><h2 className="font-semibold">{fa ? 'اتصال خصوصی بات' : 'Private bot connection'}</h2><p className="text-xs text-slate-400">{fa ? 'اطلاعات ورود فقط برای همین درخواست استفاده می‌شود و ذخیره نخواهد شد.' : 'Credentials are used only for this request and are never stored.'}</p></div></div>
      <div className="space-y-4"><label className="block text-sm"><span className="mb-1 block text-slate-300">{fa ? 'توکن بات' : 'Bot token'}</span><input dir="ltr" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456:AA..." className="w-full rounded-lg border border-line bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label><label className="block text-sm"><span className="mb-1 block text-slate-300">{fa ? 'شناسه چت مدیر' : 'Manager chat ID'}</span><input dir="ltr" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder={fa ? 'مثلاً 123456789' : 'e.g. 123456789'} className="w-full rounded-lg border border-line bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label><button onClick={() => void sendStatus()} disabled={sending || !token || !chatId || !towers.length} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"><Send className="h-4 w-4" />{sending ? (fa ? 'در حال ارسال…' : 'Sending…') : (fa ? 'ارسال وضعیت فعلی شبکه' : 'Send current network status')}</button></div>
      {status && <p className="mt-4 rounded-lg bg-slate-950/70 p-3 text-sm text-cyan-200"><BellRing className="mr-2 inline h-4 w-4" />{status}</p>}
    </section>
    {showGuide && <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="telegram-guide-title" onClick={() => setShowGuide(false)}>
      <div className="w-full max-w-lg rounded-2xl border border-cyan-800/70 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/40" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-cyan-300">{fa ? 'راه‌اندازی سریع' : 'QUICK SETUP'}</p><h2 id="telegram-guide-title" className="mt-1 text-xl font-bold">{fa ? 'اتصال بات تلگرام' : 'Connect your Telegram bot'}</h2></div><button type="button" onClick={() => setShowGuide(false)} aria-label={fa ? 'بستن راهنما' : 'Close guide'} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button></div>
        <ol className="mt-5 space-y-4 text-sm text-slate-300">
          <li><b className="text-white">{fa ? '۱. ساخت بات:' : '1. Create the bot:'}</b> {fa ? 'در تلگرام عبارت ' : 'Open Telegram, search for '}<code dir="ltr" className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">@BotFather</code>{fa ? ' را جستجو کنید، دستور ' : ', send '}<code dir="ltr" className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">/newbot</code>{fa ? ' را بفرستید و مراحل را تکمیل کنید.' : ', and complete the setup.'}</li>
          <li><b className="text-white">{fa ? '۲. کپی توکن:' : '2. Copy the token:'}</b> {fa ? 'BotFather توکنی شبیه ' : 'BotFather will send a token similar to '}<code dir="ltr" className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">123456:AA...</code>{fa ? ' ارسال می‌کند. آن را در فیلد توکن وارد کنید و هرگز عمومی منتشر نکنید.' : '. Paste it into the Bot token field. Never share it publicly.'}</li>
          <li><b className="text-white">{fa ? '۳. شروع گفتگو:' : '3. Start the conversation:'}</b> {fa ? 'بات جدید را باز کنید و دکمه ' : 'Open your new bot and press '}<b className="text-cyan-200">Start</b>{fa ? ' را بزنید یا یک پیام بفرستید.' : ' or send any message.'}</li>
          <li><b className="text-white">{fa ? '۴. دریافت Chat ID:' : '4. Get your Chat ID:'}</b> {fa ? 'بات ' : 'Open '}<code dir="ltr" className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">@userinfobot</code>{fa ? ' را باز کنید، Start را بزنید و شناسه عددی نمایش‌داده‌شده را کپی کنید.' : ' in Telegram, press Start, and copy the numeric ID it returns.'}</li>
          <li><b className="text-white">{fa ? '۵. ارسال وضعیت:' : '5. Send status:'}</b> {fa ? 'به این صفحه برگردید، هر دو مقدار را وارد کنید و دکمه ارسال وضعیت فعلی شبکه را بزنید.' : 'Return here, enter both values, then click Send current network status.'}</li>
        </ol>
        <p className="mt-5 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-200">{fa ? 'توکن فقط برای همین درخواست به‌شکل امن به سرور ارسال می‌شود و در مرورگر یا پایگاه داده ذخیره نخواهد شد.' : 'The token is sent securely to the server for this request only and is not saved in the browser or database.'}</p>
      </div>
    </div>}
  </main>
}
