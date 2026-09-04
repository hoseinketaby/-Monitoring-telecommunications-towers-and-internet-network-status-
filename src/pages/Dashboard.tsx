import { useMemo } from "react";
import { useMonitorStore } from "../store";
import { useI18n } from "../i18n";
import { KpiCards } from "../components/Dashboard/KpiCards";
import { UptimeChart } from "../components/Dashboard/UptimeChart";
import { RiskTable } from "../components/Dashboard/RiskTable";
import { ExportButton } from "../components/Dashboard/ExportButton";

export function Dashboard() {
  const towers = useMonitorStore((state) => state.towers);
  const { language, t } = useI18n();

  return (
    <section className="space-y-4" dir={language === "fa" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.24em] text-sky-300">{t("managementDashboard")}</p>
          <h1 className="mt-1 text-2xl font-bold">{t("managementDashboard")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("dashboardSubtitle")}</p>
        </div>
        <ExportButton towers={towers} />
      </div>
      <KpiCards towers={towers} />
      <div className="grid gap-4 xl:grid-cols-2">
        <UptimeChart towers={towers} />
        <RiskTable towers={towers} />
      </div>
    </section>
  );
}
