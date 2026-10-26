import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../components/Ui";
import { useI18n } from "../i18n/I18nProvider";
import { fetchSummary } from "../lib/api";
import { loadModules } from "../lib/content";
import { readQuiz } from "../lib/quizStorage";
import { useTheme } from "../components/Theme";
import type { AnalyticsSummary, LearningModule } from "../types";
import { localText } from "./LearnPage";

const CHART = "#456f3a";

export default function DashboardPage() {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [quiz] = useState(() => readQuiz());

  useEffect(() => {
    document.title = `${t.dashboard.title} · ${t.brand}`;
  }, [t.dashboard.title, t.brand]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchSummary().then((body) => body.summary).catch(() => null),
      loadModules().catch(() => [] as LearningModule[]),
    ]).then(([nextSummary, nextModules]) => {
      if (!active) return;
      setSummary(nextSummary);
      setModules(nextModules);
      setFailed(nextSummary === null);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  const tick = theme === "dark" ? "#b4b4b4" : "#6b5b51";
  const distribution = summary
    ? (["low", "medium", "high", "critical"] as const).map((key) => ({
        key,
        label: t.categories[key].label,
        count: summary.distribution[key],
      }))
    : [];
  const indicators = summary
    ? summary.topIndicators.map((item) => ({
        label: t.indicators[item.code as keyof typeof t.indicators]?.title ?? item.code,
        count: item.count,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">{t.dashboard.intro}</p>
      </div>
      {failed ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950">
          <p>{t.dashboard.unavailable}</p>
          <Button className="mt-3" variant="secondary" onClick={() => setAttempt((value) => value + 1)}>{t.dashboard.retry}</Button>
        </div>
      ) : null}
      {summary ? (
        <>
          <p className={`p-4 text-sm leading-6 ${summary.illustrative ? "bg-[#fffbeb] text-[#92400e]" : "bg-[#f4f6f8] dark:bg-[#222]"}`}>
            {t.dashboard.banners[summary.disclaimer]}
          </p>
          {summary.disclaimer !== "supabase_unavailable" ? (
            <>
              <div className="grid grid-cols-2 divide-[#e8eaec] overflow-hidden rounded-lg border border-[#e8eaec] dark:divide-[#2a2a2a] dark:border-[#2a2a2a] sm:grid-cols-5 sm:divide-x">
                <Stat label={t.dashboard.total} value={summary.total} />
                {distribution.map((item) => (
                  <Stat key={item.key} label={item.label} value={item.count} />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border border-[#e8eaec] p-4 dark:border-[#2a2a2a]">
                  <h2 className="text-base font-medium">{t.dashboard.distribution}</h2>
                  <div className="mt-3 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution}>
                        <XAxis dataKey="label" tick={{ fill: tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART} radius={[0, 0, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="rounded-lg border border-[#e8eaec] p-4 dark:border-[#2a2a2a]">
                  <h2 className="font-bold">{t.dashboard.common}</h2>
                  {indicators.length === 0 ? (
                    <p className="mt-4 text-sm">{t.dashboard.noneYet}</p>
                  ) : (
                    <div className="mt-3 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={indicators} layout="vertical" margin={{ left: 16 }}>
                          <XAxis type="number" allowDecimals={false} tick={{ fill: tick, fontSize: 12 }} />
                          <YAxis type="category" dataKey="label" width={140} tick={{ fill: tick, fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill={CHART} radius={[0, 0, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>
              <section className="overflow-x-auto rounded-lg border border-[#e8eaec] dark:border-[#2a2a2a]">
                <h2 className="px-4 pt-4 text-base font-medium">{t.dashboard.recent}</h2>
                {summary.recent.length === 0 ? <p className="px-4 py-4 text-sm">{t.dashboard.noneYet}</p> : (
                  <table className="mt-2 w-full min-w-[40rem] text-left text-sm">
                    <thead className="text-xs text-[#6b5b51] dark:text-[#b4b4b4]">
                      <tr>
                        <th className="px-4 py-2 font-semibold">{t.dashboard.when}</th>
                        <th className="px-4 py-2 font-semibold">{t.dashboard.kind}</th>
                        <th className="px-4 py-2 font-semibold">{t.dashboard.band}</th>
                        <th className="px-4 py-2 font-semibold">{t.dashboard.codes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent.map((event) => (
                        <tr key={event.id} className="border-t border-slate-200 dark:border-slate-700">
                          <td className="px-4 py-3 whitespace-nowrap">{new Intl.DateTimeFormat(language === "ta" ? "ta-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.at))}</td>
                          <td className="px-4 py-3">{t.dashboard.kinds[event.kind]}</td>
                          <td className="px-4 py-3">{t.categories[event.riskCategory].label}</td>
                          <td className="px-4 py-3">
                            <ul className="flex flex-wrap gap-1">
                              {event.indicatorCodes.map((code) => (
                                <li key={code} className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-navy-800">
                                  {t.indicators[code as keyof typeof t.indicators]?.title ?? code}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          ) : null}
        </>
      ) : null}
      <section className="rounded-lg border border-[#e8eaec] p-5 dark:border-[#2a2a2a]">
        <h2 className="font-bold">{t.dashboard.quizTitle}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.dashboard.quizDevice}</p>
        {Object.keys(quiz).length === 0 ? <p className="mt-3 text-sm">{t.dashboard.quizEmpty}</p> : (
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(quiz).map(([id, record]) => {
              const learningModule = modules.find((item) => item.id === id);
              return (
                <li key={id} className="flex justify-between gap-3 border-b border-slate-100 py-2 dark:border-slate-800">
                  <span>{learningModule ? localText(learningModule.title, language) : id}</span>
                  <span className="font-semibold tabular-nums">{record.score}/{record.total}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4">
      <p className="text-sm text-[#6b5b51] dark:text-[#b4b4b4]">{label}</p>
      <p className="num mt-1 text-[28px] font-normal">{value}</p>
    </div>
  );
}
