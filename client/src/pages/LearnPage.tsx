import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fill } from "../i18n/en";
import { useI18n } from "../i18n/I18nProvider";
import { loadModules } from "../lib/content";
import type { Language } from "../i18n/en";
import type { LearningModule, Localized } from "../types";

export function localText(value: Localized, language: Language): string {
  return value[language] || value.en;
}

export default function LearnPage() {
  const { t, language } = useI18n();
  const [modules, setModules] = useState<LearningModule[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = `${t.learn.title} · ${t.brand}`;
  }, [t.learn.title, t.brand]);

  useEffect(() => {
    let active = true;
    loadModules()
      .then((items) => {
        if (active) setModules(items);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">{t.learn.title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">{t.learn.intro}</p>
      {failed ? <p role="alert" className="mt-6 text-sm font-semibold text-red-700">{t.learn.unavailable}</p> : null}
      {modules === null && !failed ? <p className="mt-6 text-sm">{t.analyze.loading}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {modules?.map((module) => (
          <article key={module.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-navy-900">
            <h2 className="text-lg font-bold">{localText(module.title, language)}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{localText(module.summary, language)}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {fill(t.learn.minutes, { n: module.minutes })} · {fill(t.learn.questions, { n: module.quiz.length })}
            </p>
            <Link to={`/learn/${module.id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300">
              {t.learn.start}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
