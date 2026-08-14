import { useEffect, useState } from 'react'
import { Check, Cpu } from 'lucide-react'
import { fallbackGapGptModels, getGapGptModels } from '../../agent/models'
import { getAiSettings, saveAiSettings } from '../../config/runtime'

export function AiSettings() {
  const initial = getAiSettings()
  const [model, setModel] = useState(initial.model)
  const [models, setModels] = useState(fallbackGapGptModels)
  const [saved, setSaved] = useState(false)

  useEffect(() => { void getGapGptModels().then(setModels) }, [])

  const save = () => {
    saveAiSettings({ model })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <section className="rounded-xl border border-line bg-slate-950/40 p-3">
      <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-sky-300" /><h3 className="text-sm font-semibold">مدل GapGPT</h3></div>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">کلید API فقط روی سرور نگه‌داری می‌شود و در مرورگر ذخیره یا نمایش داده نمی‌شود.</p>
      <label className="mt-3 block text-xs text-slate-400">مدل پیش‌فرض</label>
      <select dir="ltr" value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-slate-900 px-3 py-2 text-left text-xs outline-none focus:border-sky-500">
        {models.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button onClick={save} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400">{saved ? <Check className="h-4 w-4" /> : null}{saved ? 'ذخیره شد' : 'ذخیره تنظیمات'}</button>
    </section>
  )
}
