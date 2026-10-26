import type { Dictionary } from "../i18n/en";
import type { AnalysisResult } from "../types";

export function buildSummary(result: AnalysisResult, t: Dictionary): string {
  const titles = result.indicators.map((indicator) => {
    const known = t.indicators[indicator.code as keyof typeof t.indicators];
    return `- ${known?.title ?? indicator.code}`;
  });
  return [
    "SURAKSHIT",
    `${t.analyze.level}: ${t.categories[result.riskCategory].label}`,
    `${t.analyze.score}: ${result.score}/100`,
    t.analyze.indicators,
    ...(titles.length > 0 ? titles : [`- ${t.analyze.noIndicators}`]),
    t.limitations.heuristic_not_proof,
    t.recommendations.result_is_not_proof,
  ].join("\n");
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
