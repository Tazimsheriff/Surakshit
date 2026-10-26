export type RiskCategory = "low" | "medium" | "high" | "critical";

export interface AppliedIndicator {
  code: string;
  appliedWeight: number;
  severity: "info" | "caution" | "warning";
  evidence?: string;
}

export interface ParsedUrl {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
  port: string | null;
  queryKeys: string[];
  missingScheme: boolean;
}

export interface AiNote {
  used: boolean;
  reason?: "no_consent" | "not_configured" | "unavailable" | "invalid_response";
  explanation?: string;
  extraCautions?: string[];
}

export interface AnalysisResult {
  kind: "message" | "url";
  riskCategory: RiskCategory;
  score: number;
  scoreSource: "heuristic_rules";
  indicators: AppliedIndicator[];
  recommendationCodes: string[];
  limitationCodes: string[];
  highlightedPhrases: string[];
  parsedUrl?: ParsedUrl;
  ai: AiNote;
}

export interface AnalyticsSummary {
  mode: "demo" | "session" | "supabase";
  illustrative: boolean;
  persistence: "memory" | "supabase";
  total: number;
  distribution: Record<RiskCategory, number>;
  topIndicators: Array<{ code: string; count: number }>;
  recent: Array<{
    id: string;
    at: string;
    kind: "message" | "url";
    riskCategory: RiskCategory;
    scoreBand: string;
    indicatorCodes: string[];
    language: "en" | "ta";
  }>;
  disclaimer: "illustrative_demo" | "session_memory" | "supabase_live" | "supabase_empty" | "supabase_unavailable";
}

export interface Localized {
  en: string;
  ta: string;
}

export interface LearningModule {
  id: string;
  minutes: number;
  title: Localized;
  summary: Localized;
  explanation: Localized;
  warningSigns: Localized[];
  example: Localized;
  safeActions: Localized[];
  quiz: Array<{
    id: string;
    prompt: Localized;
    choices: Localized[];
    correctIndex: number;
    explanation: Localized;
  }>;
}

export interface HealthStatus {
  ok: boolean;
  service: string;
  aiConfigured: boolean;
  persistence: "memory" | "supabase";
}
