import { useState } from 'react'
import { Check, KeyRound } from 'lucide-react'
import { getAiSettings, saveAiSettings } from '../../config/runtime'

const defaultModel = 'nvidia/nemotron-3-ultra-550b-a55b:free'

export function AiSettings() {
  const initial = getAiSettings()
  const [apiKey, setApiKey] = useState(initial.openRouterKey)
  const [model, setModel] = useState(initial.model || defaultModel)
  const [saved, setSaved] = useState(false)
  const save = () => {
    saveAiSettings({ openRouterKey: apiKey.trim(), model: model.trim() || defaultModel })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }
  return (
    <section className="rounded-xl border border-line bg-slate-950/40 p-3">
      <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-sky-300" /><h3 className="text-sm font-semibold">تنظیمات OpenRouter</h3></div>
      <label className="mt-3 block text-xs text-slate-400">API Key</label>
      <input dir="ltr" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-or-v1-..." className="mt-1 w-full rounded-lg border border-line bg-slate-900 px-3 py-2 text-left text-xs outline-none focus:border-sky-500" />
      <label className="mt-3 block text-xs text-slate-400">مدل</label>
      <input dir="ltr" value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-slate-900 px-3 py-2 text-left text-xs outline-none focus:border-sky-500" />
      <button onClick={save} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400">{saved ? <Check className="h-4 w-4" /> : null}{saved ? 'ذخیره شد' : 'ذخیره تنظیمات'}</button>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">کلید فقط در مرورگر شما ذخیره می‌شود. مدل پیش‌فرض: NVIDIA Nemotron 3 Ultra (رایگان).</p>
    </section>
  )
}
