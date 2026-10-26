import { fill } from "../i18n/en";
import type { Dictionary } from "../i18n/en";
import { splitHighlight } from "../lib/highlight";
import type { AnalysisResult } from "../types";

const bandClass: Record<AnalysisResult["riskCategory"], string> = {
  low: "bg-teal-700",
  medium: "bg-amber-600",
  high: "bg-orange-700",
  critical: "bg-red-700",
};

export function textFor(map: object, code: string): string {
  if (code in map) {
    const value = (map as Record<string, unknown>)[code];
    if (typeof value === "string") return value;
  }
  return code;
}

export function HighlightedText({ text, phrases }: { text: string; phrases: string[] }) {
  const parts = splitHighlight(text, phrases);
  return (
    <p className="whitespace-pre-wrap break-words leading-7">
      {parts.map((part, index) =>
        part.match ? (
          <mark key={`${part.text}-${index}`} className="hit">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}

export function RiskResult({
  result,
  sourceText,
  t,
}: {
  result: AnalysisResult;
  sourceText?: string;
  t: Dictionary;
}) {
  const category = t.categories[result.riskCategory];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t.analyze.level}</p>
          <p className="mt-1 text-3xl font-bold">{category.label}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-300">{category.description}</p>
        </div>
        <div className="min-w-36">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.analyze.score}</p>
          <p className="text-4xl font-bold tabular-nums">{result.score}</p>
          <div
            className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={result.score}
            aria-label={t.analyze.score}
          >
            <div className={`h-3 rounded-full ${bandClass[result.riskCategory]}`} style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold">{t.analyze.indicators}</h3>
        {result.indicators.length === 0 ? (
          <p className="mt-2 text-sm leading-6">{t.analyze.noIndicators}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {result.indicators.map((indicator) => {
              const copy = t.indicators[indicator.code as keyof typeof t.indicators];
              return (
                <li key={indicator.code} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-semibold">{copy?.title ?? indicator.code}</h4>
                    <p className="text-xs font-semibold text-slate-500">{fill(t.analyze.points, { n: indicator.appliedWeight })}</p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy?.explanation ?? indicator.code}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {result.kind === "message" && sourceText ? (
        <div>
          <h3 className="text-lg font-bold">{t.analyze.checkedText}</h3>
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-navy-950">
            <HighlightedText text={sourceText} phrases={result.highlightedPhrases} />
          </div>
        </div>
      ) : null}

      {result.kind === "url" && result.parsedUrl ? (
        <div>
          <h3 className="text-lg font-bold">{t.analyze.why}</h3>
          <p className="mt-1 text-sm font-semibold text-teal-800 dark:text-teal-300">{t.analyze.notOpened}</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">{t.analyze.scheme}</dt>
              <dd className="break-all font-mono">{result.parsedUrl.protocol}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t.analyze.host}</dt>
              <dd className="break-all font-mono">{result.parsedUrl.hostname}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t.analyze.path}</dt>
              <dd className="break-all font-mono">{result.parsedUrl.pathname}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t.analyze.port}</dt>
              <dd className="font-mono">{result.parsedUrl.port ?? t.analyze.defaultPort}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-500">{t.analyze.query}</dt>
              <dd className="break-all font-mono">
                {result.parsedUrl.queryKeys.length > 0 ? result.parsedUrl.queryKeys.join(", ") : t.analyze.noQuery}
              </dd>
            </div>
          </dl>
          {result.parsedUrl.missingScheme ? <p className="mt-2 text-sm">{t.analyze.missingScheme}</p> : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-lg font-bold">{t.analyze.next}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {result.recommendationCodes.map((code) => (
            <li key={code}>{textFor(t.recommendations, code)}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold">{t.analyze.limits}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
          {result.limitationCodes.map((code) => (
            <li key={code}>{textFor(t.limitations, code)}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <h3 className="font-bold">{t.analyze.aiTitle}</h3>
        {result.ai.used ? (
          <div className="mt-2 space-y-2 text-sm leading-6">
            <p className="font-semibold">{t.analyze.aiUsed}</p>
            <p>{result.ai.explanation}</p>
            {result.ai.extraCautions && result.ai.extraCautions.length > 0 ? (
              <ul className="list-disc pl-5">
                {result.ai.extraCautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {t.analyze.aiReasons[result.ai.reason ?? "not_configured"]}
          </p>
        )}
      </div>
    </div>
  );
}
