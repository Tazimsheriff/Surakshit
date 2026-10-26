export const RISK_CATEGORIES = ["low", "medium", "high", "critical"] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const INDICATOR_CODES = [
  "urgency",
  "credential_request",
  "prize_or_job_fee",
  "impersonation",
  "short_url",
  "insecure_link",
  "app_install",
  "account_threat",
  "verification_transfer",
  "payment_request",
  "insecure_http",
  "ip_hostname",
  "excessive_subdomains",
  "brand_impersonation",
  "punycode_host",
  "url_shortener",
  "unusual_port",
  "excessive_length",
  "embedded_credentials",
  "lookalike_domain",
  "deceptive_path",
  "sensitive_query",
  "missing_scheme",
] as const;

export type IndicatorCode = (typeof INDICATOR_CODES)[number];
export type Severity = "info" | "caution" | "warning";

export interface Finding {
  code: IndicatorCode;
  weight: number;
  group: string;
  severity: Severity;
  evidence?: string;
}

export interface AppliedIndicator {
  code: IndicatorCode;
  appliedWeight: number;
  severity: Severity;
  evidence?: string;
}

export interface ParsedUrlDetails {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
  port: string | null;
  queryKeys: string[];
  missingScheme: boolean;
}

export interface RuleAnalysis {
  kind: "message" | "url";
  riskCategory: RiskCategory;
  score: number;
  scoreSource: "heuristic_rules";
  indicators: AppliedIndicator[];
  recommendationCodes: string[];
  limitationCodes: string[];
  highlightedPhrases: string[];
  parsedUrl?: ParsedUrlDetails;
}

export type EngineErrorCode = "empty" | "too_long" | "malformed" | "unsupported_scheme";

export type EngineOutcome = { ok: true; analysis: RuleAnalysis } | { ok: false; error: EngineErrorCode };
