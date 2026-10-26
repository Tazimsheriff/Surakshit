import type { AppConfig } from "../config.js";
import { supabaseConfigured } from "../config.js";
import { scoreBand } from "../detectors/scoring.js";
import type { AnalysisEvent, AnalyticsStore, AnalyticsSummary } from "./analyticsStore.js";
import { createMemoryStore, summarizeEvents } from "./analyticsStore.js";

interface StoredRow {
  id: string;
  created_at: string;
  kind: "message" | "url";
  risk_category: AnalysisEvent["riskCategory"];
  score_band: AnalysisEvent["scoreBand"];
  indicator_codes: string[];
  language: "en" | "ta";
  ai_used: boolean;
  consent_to_ai: boolean;
}

function rowToEvent(row: StoredRow): AnalysisEvent {
  return {
    id: row.id,
    at: row.created_at,
    kind: row.kind,
    riskCategory: row.risk_category,
    scoreBand: row.score_band,
    indicatorCodes: row.indicator_codes ?? [],
    language: row.language,
    aiUsed: row.ai_used,
    consentToAi: row.consent_to_ai,
  };
}

export function createSupabaseStore(config: AppConfig, fetchImpl: typeof fetch = fetch): AnalyticsStore {
  const memory = createMemoryStore();
  if (!supabaseConfigured(config)) return memory;

  const headers = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
  };

  return {
    persistence: () => "supabase",
    async record(event) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetchImpl(`${config.supabaseUrl}/rest/v1/analysis_events`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=minimal" },
          signal: controller.signal,
          body: JSON.stringify({
            kind: event.kind,
            risk_category: event.riskCategory,
            score_band: scoreBand(event.score),
            indicator_codes: event.indicatorCodes.slice(0, 12),
            language: event.language,
            ai_used: event.aiUsed,
            consent_to_ai: event.consentToAi,
          }),
        });
        if (!response.ok) await memory.record(event);
      } catch {
        await memory.record(event);
      } finally {
        clearTimeout(timer);
      }
    },
    async summary(): Promise<AnalyticsSummary> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetchImpl(
          `${config.supabaseUrl}/rest/v1/analysis_events?select=id,created_at,kind,risk_category,score_band,indicator_codes,language,ai_used,consent_to_ai&order=created_at.desc&limit=200`,
          { headers, signal: controller.signal },
        );
        if (!response.ok) {
          return summarizeEvents([], {
            mode: "supabase",
            illustrative: false,
            persistence: "supabase",
            disclaimer: "supabase_unavailable",
          });
        }
        const rows = (await response.json()) as StoredRow[];
        return summarizeEvents(rows.map(rowToEvent), {
          mode: "supabase",
          illustrative: false,
          persistence: "supabase",
          disclaimer: rows.length === 0 ? "supabase_empty" : "supabase_live",
        });
      } catch {
        return summarizeEvents([], {
          mode: "supabase",
          illustrative: false,
          persistence: "supabase",
          disclaimer: "supabase_unavailable",
        });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
