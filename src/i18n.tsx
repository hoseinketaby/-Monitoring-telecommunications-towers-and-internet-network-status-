import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'fa' | 'en'

const translations = {
  fa: {
    brand: 'پایش هوشمند دکل‌ها',
    dashboard: 'داشبورد',
    map: 'نقشه و هشدارها',
    simulation: 'شبیه‌ساز تجهیزات',
    logs: 'لاگ شبکه',
    refresh: 'به‌روزرسانی',
    lastRefresh: 'آخرین به‌روزرسانی',
    language: 'English',
    managementDashboard: 'داشبورد مدیریتی',
    dashboardSubtitle: 'پایش سلامت، توان و ریسک عملیاتی شبکه',
    exportCsv: 'خروجی CSV',
    printPdf: 'چاپ / PDF',
    towerCount: 'کل دکل‌ها',
    online: 'آنلاین',
    avgBattery: 'میانگین سلامت باتری',
    outages: 'قطعی برق فعال',
    uptime24: 'روند پایداری در ۲۴ ساعت',
    riskyTowers: 'دکل‌های پرریسک',
    tower: 'دکل',
    status: 'وضعیت',
    power: 'برق',
    battery: 'باتری',
    risk: 'ریسک',
    networkPulse: 'نبض شبکه',
    healthy: 'پایدار',
    attention: 'نیازمند توجه',
    critical: 'بحرانی',
    live: 'زنده',
    analytics: 'تحلیل نموداری',
  },
  en: {
    brand: 'Smart Tower Monitor',
    dashboard: 'Dashboard',
    map: 'Map & Alerts',
    simulation: 'Equipment Simulator',
    logs: 'Network Logs',
    refresh: 'Refresh',
    lastRefresh: 'Last refresh',
    language: 'فارسی',
    managementDashboard: 'Management Dashboard',
    dashboardSubtitle: 'Monitor network health, power, and operational risk',
    exportCsv: 'Export CSV',
    printPdf: 'Print / PDF',
    towerCount: 'Total towers',
    online: 'Online',
    avgBattery: 'Avg. battery health',
    outages: 'Active power outages',
    uptime24: '24-hour uptime trend',
    riskyTowers: 'Highest-risk towers',
    tower: 'Tower',
    status: 'Status',
    power: 'Power',
    battery: 'Battery',
    risk: 'Risk',
    networkPulse: 'Network pulse',
    healthy: 'Healthy',
    attention: 'Needs attention',
    critical: 'Critical',
    live: 'LIVE',
    analytics: 'Analytics',
  },
} as const

type TranslationKey = keyof typeof translations.fa
type I18nValue = { language: Language; toggleLanguage: () => void; t: (key: TranslationKey) => string }
const I18nContext = createContext<I18nValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('telecom-language') as Language) || 'fa')
  useEffect(() => {
    localStorage.setItem('telecom-language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
  }, [language])
  const value = useMemo(() => ({ language, toggleLanguage: () => setLanguage((current) => current === 'fa' ? 'en' : 'fa'), t: (key: TranslationKey) => translations[language][key] }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}
