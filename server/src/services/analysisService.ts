import type { AppConfig } from "../config.js";
import { analyzeMessage } from "../detectors/message/analyzeMessage.js";
import { analyzeUrl } from "../detectors/url/analyzeUrl.js";
import { parseUserUrl } from "../detectors/url/parseUrl.js";
import type { RuleAnalysis } from "../detectors/types.js";
import type { MessageRequest, UrlRequest } from "../schemas/analyze.js";
import { maybeExplain, type AiOutcome } from "./aiProvider.js";
import type { AnalyticsStore } from "./analyticsStore.js";

export interface AnalysisResponseBody {
  ok: true;
  result: RuleAnalysis & { ai: AiOutcome };
}

function redactForExternalAi(kind: RuleAnalysis["kind"], content: string): string {
  if (kind === "url") {
    const parsed = parseUserUrl(content);
    if (!parsed.ok) return "Unparsed URL omitted.";
    const { url, missingScheme } = parsed.parsed;
    const keyNames = [...url.searchParams.keys()].slice(0, 20);
    return [
      missingScheme ? "scheme: missing" : `scheme: ${url.protocol.replace(":", "")}`,
      `host: ${url.hostname}`,
      url.port ? `port: ${url.port}` : "port: default",
      `path: ${url.pathname || "/"}`,
      keyNames.length > 0 ? `query key names only: ${keyNames.join(", ")}` : "query: none",
    ].join("\n");
  }
  return content.replace(/\b\d{5,}\b/g, "[digits]");
}

async function finish(
  analysis: RuleAnalysis,
  content: string,
  request: { consentToAi: boolean; language: "en" | "ta" },
  config: AppConfig,
  store: AnalyticsStore,
  fetchImpl: typeof fetch,
): Promise<AnalysisResponseBody> {
  const ai = await maybeExplain(
    {
      kind: analysis.kind,
      content: redactForExternalAi(analysis.kind, content),
      indicatorCodes: analysis.indicators.map((indicator) => indicator.code),
      score: analysis.score,
      language: request.language,
      consent: request.consentToAi,
    },
    config,
    fetchImpl,
  );
  try {
    await store.record({
      kind: analysis.kind,
      riskCategory: analysis.riskCategory,
      score: analysis.score,
      indicatorCodes: analysis.indicators.map((indicator) => indicator.code),
      language: request.language,
      aiUsed: ai.used,
      consentToAi: request.consentToAi,
    });
  } catch {
    // Analytics must not block a result the person is waiting for.
  }
  return { ok: true, result: { ...analysis, ai } };
}

export async function performMessageAnalysis(
  request: MessageRequest,
  config: AppConfig,
  store: AnalyticsStore,
  fetchImpl: typeof fetch,
): Promise<AnalysisResponseBody> {
  const outcome = analyzeMessage(request.text);
  if (!outcome.ok) throw new Error(outcome.error);
  return finish(outcome.analysis, request.text, request, config, store, fetchImpl);
}

export async function performUrlAnalysis(
  request: UrlRequest,
  config: AppConfig,
  store: AnalyticsStore,
  fetchImpl: typeof fetch,
): Promise<{ status: number; body: AnalysisResponseBody | { ok: false; error: { code: string; reason: string } } }> {
  const outcome = analyzeUrl(request.url);
  if (!outcome.ok) {
    return {
      status: 422,
      body: { ok: false, error: { code: "invalid_url", reason: outcome.error } },
    };
  }
  const body = await finish(outcome.analysis, request.url, request, config, store, fetchImpl);
  return { status: 200, body };
}
