import type { AppliedIndicator, Finding, RiskCategory } from "./types.js";
import { GROUP_CAPS } from "./weights.js";

export function categoryForScore(score: number): RiskCategory {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function scoreBand(score: number): "0-24" | "25-49" | "50-74" | "75-100" {
  if (score >= 75) return "75-100";
  if (score >= 50) return "50-74";
  if (score >= 25) return "25-49";
  return "0-24";
}

export function sanitizeSnippet(value: string): string {
  let cleaned = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    cleaned += code <= 31 || code === 127 ? " " : char;
  }
  return cleaned.replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Overlapping signals in the same group are discounted so one scam theme
 * cannot stack the same concern several times.
 */
export function aggregate(findings: Finding[]): { score: number; indicators: AppliedIndicator[] } {
  const groups = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = groups.get(finding.group) ?? [];
    list.push(finding);
    groups.set(finding.group, list);
  }

  const indicators: AppliedIndicator[] = [];
  let total = 0;

  for (const [group, list] of groups) {
    const sorted = [...list].sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));
    const cap = GROUP_CAPS[group as keyof typeof GROUP_CAPS] ?? 100;
    let used = 0;
    sorted.forEach((finding, index) => {
      const factor = index === 0 ? 1 : index === 1 ? 0.5 : 0.25;
      let applied = Math.round(finding.weight * factor);
      if (used + applied > cap) applied = Math.max(0, cap - used);
      used += applied;
      const indicator: AppliedIndicator = {
        code: finding.code,
        appliedWeight: applied,
        severity: finding.severity,
      };
      if (finding.evidence) indicator.evidence = finding.evidence;
      indicators.push(indicator);
    });
    total += used;
  }

  indicators.sort((a, b) => b.appliedWeight - a.appliedWeight || a.code.localeCompare(b.code));
  return { score: Math.min(100, total), indicators };
}
