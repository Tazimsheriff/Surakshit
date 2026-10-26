import type { RiskCategory } from "../detectors/types.js";
import { scoreBand } from "../detectors/scoring.js";

export interface AnalysisEvent {
  id: string;
  at: string;
  kind: "message" | "url";
  riskCategory: RiskCategory;
  scoreBand: ReturnType<typeof scoreBand>;
  indicatorCodes: string[];
  language: "en" | "ta";
  aiUsed: boolean;
  consentToAi: boolean;
}

export interface AnalyticsSummary {
  mode: "demo" | "session" | "supabase";
  illustrative: boolean;
  persistence: "memory" | "supabase";
  total: number;
  distribution: Record<RiskCategory, number>;
  topIndicators: Array<{ code: string; count: number }>;
  recent: AnalysisEvent[];
  disclaimer: "illustrative_demo" | "session_memory" | "supabase_live" | "supabase_empty" | "supabase_unavailable";
}

const DEMO_EVENTS: AnalysisEvent[] = [
  {
    id: "demo-1",
    at: "2026-04-02T09:15:00.000Z",
    kind: "message",
    riskCategory: "high",
    scoreBand: "50-74",
    indicatorCodes: ["credential_request", "impersonation", "account_threat"],
    language: "en",
    aiUsed: false,
    consentToAi: false,
  },
  {
    id: "demo-2",
    at: "2026-04-02T09:40:00.000Z",
    kind: "url",
    riskCategory: "medium",
    scoreBand: "25-49",
    indicatorCodes: ["lookalike_domain"],
    language: "en",
    aiUsed: false,
    consentToAi: false,
  },
  {
    id: "demo-3",
    at: "2026-04-02T10:05:00.000Z",
    kind: "message",
    riskCategory: "low",
    scoreBand: "0-24",
    indicatorCodes: ["impersonation"],
    language: "ta",
    aiUsed: false,
    consentToAi: false,
  },
  {
    id: "demo-4",
    at: "2026-04-02T10:20:00.000Z",
    kind: "message",
    riskCategory: "critical",
    scoreBand: "75-100",
    indicatorCodes: ["verification_transfer", "credential_request", "app_install"],
    language: "en",
    aiUsed: false,
    consentToAi: false,
  },
  {
    id: "demo-5",
    at: "2026-04-02T11:00:00.000Z",
    kind: "url",
    riskCategory: "low",
    scoreBand: "0-24",
    indicatorCodes: ["url_shortener"],
    language: "ta",
    aiUsed: false,
    consentToAi: false,
  },
];

function emptyDistribution(): Record<RiskCategory, number> {
  return { low: 0, medium: 0, high: 0, critical: 0 };
}

export function summarizeEvents(
  events: AnalysisEvent[],
  meta: Pick<AnalyticsSummary, "mode" | "illustrative" | "persistence" | "disclaimer">,
): AnalyticsSummary {
  const distribution = emptyDistribution();
  const counts = new Map<string, number>();
  for (const event of events) {
    distribution[event.riskCategory] += 1;
    for (const code of event.indicatorCodes) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const topIndicators = [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, 6);
  const recent = [...events].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);
  return {
    ...meta,
    total: events.length,
    distribution,
    topIndicators,
    recent,
  };
}

export function illustrativeSummary(): AnalyticsSummary {
  const summary = summarizeEvents(DEMO_EVENTS, {
    mode: "demo",
    illustrative: true,
    persistence: "memory",
    disclaimer: "illustrative_demo",
  });
  const extra = [
    ["urgency", 36],
    ["prize_or_job_fee", 18],
    ["credential_request", 41],
    ["impersonation", 29],
    ["url_shortener", 14],
    ["account_threat", 22],
  ] as const;
  return {
    ...summary,
    total: 128,
    distribution: { low: 46, medium: 38, high: 32, critical: 12 },
    topIndicators: extra.map(([code, count]) => ({ code, count })),
  };
}

export interface AnalyticsStore {
  record(event: Omit<AnalysisEvent, "id" | "at" | "scoreBand"> & { score: number }): Promise<void>;
  summary(): Promise<AnalyticsSummary>;
  persistence(): "memory" | "supabase";
}

export function createMemoryStore(): AnalyticsStore {
  const events: AnalysisEvent[] = [];
  return {
    persistence: () => "memory",
    async record(event) {
      events.push({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        kind: event.kind,
        riskCategory: event.riskCategory,
        scoreBand: scoreBand(event.score),
        indicatorCodes: event.indicatorCodes.slice(0, 12),
        language: event.language,
        aiUsed: event.aiUsed,
        consentToAi: event.consentToAi,
      });
      if (events.length > 200) events.shift();
    },
    async summary() {
      if (events.length === 0) return illustrativeSummary();
      return summarizeEvents(events, {
        mode: "session",
        illustrative: false,
        persistence: "memory",
        disclaimer: "session_memory",
      });
    },
  };
}

export const defaultStore = createMemoryStore();
