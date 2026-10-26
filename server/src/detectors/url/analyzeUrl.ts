import { limitationCodes, recommendationCodes } from "../recommendations.js";
import { aggregate, categoryForScore, sanitizeSnippet } from "../scoring.js";
import type { EngineOutcome, Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import {
  hasDeceptivePath,
  isIpHostname,
  lookalikeBrand,
  matchedBrandToken,
  sensitiveQueryKeys,
} from "./hostChecks.js";
import { parseUserUrl } from "./parseUrl.js";
import { isShortenerHost } from "./shorteners.js";

function finding(partial: Finding): Finding {
  if (!partial.evidence) return partial;
  return { ...partial, evidence: sanitizeSnippet(partial.evidence) };
}

export function analyzeUrl(input: string): EngineOutcome {
  const parsed = parseUserUrl(input);
  if (!parsed.ok) return parsed;

  const { url, missingScheme } = parsed.parsed;
  const findings: Finding[] = [];
  const hostname = url.hostname;

  if (missingScheme) {
    findings.push(finding({ code: "missing_scheme", weight: WEIGHTS.missingScheme, group: "transport", severity: "info" }));
  } else if (url.protocol === "http:") {
    findings.push(
      finding({
        code: "insecure_http",
        weight: WEIGHTS.insecureHttp,
        group: "transport",
        severity: "info",
        evidence: "http",
      }),
    );
  }

  if (isIpHostname(hostname)) {
    findings.push(
      finding({
        code: "ip_hostname",
        weight: WEIGHTS.ipHostname,
        group: "host",
        severity: "warning",
        evidence: hostname.slice(0, 80),
      }),
    );
  }

  const labels = hostname.split(".").filter(Boolean);
  if (!isIpHostname(hostname) && labels.length >= 5) {
    findings.push(
      finding({
        code: "excessive_subdomains",
        weight: WEIGHTS.excessiveSubdomains,
        group: "structure",
        severity: "caution",
        evidence: hostname.slice(0, 80),
      }),
    );
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    findings.push(
      finding({
        code: "unusual_port",
        weight: WEIGHTS.unusualPort,
        group: "structure",
        severity: "caution",
        evidence: url.port,
      }),
    );
  }

  if (input.trim().length > 180 || url.pathname.length + url.search.length > 120) {
    findings.push(
      finding({
        code: "excessive_length",
        weight: WEIGHTS.excessiveLength,
        group: "structure",
        severity: "info",
      }),
    );
  }

  const brand = matchedBrandToken(hostname);
  if (brand) {
    findings.push(
      finding({
        code: "brand_impersonation",
        weight: WEIGHTS.brandImpersonation,
        group: "deception",
        severity: "warning",
        evidence: brand,
      }),
    );
  }

  const lookalike = lookalikeBrand(hostname);
  if (lookalike) {
    findings.push(
      finding({
        code: "lookalike_domain",
        weight: WEIGHTS.lookalikeDomain,
        group: "deception",
        severity: "warning",
        evidence: lookalike,
      }),
    );
  }

  if (hostname.toLowerCase().includes("xn--")) {
    findings.push(
      finding({
        code: "punycode_host",
        weight: WEIGHTS.punycodeHost,
        group: "deception",
        severity: "info",
      }),
    );
  }

  if (hasDeceptivePath(url)) {
    findings.push(
      finding({
        code: "deceptive_path",
        weight: WEIGHTS.deceptivePath,
        group: "deception",
        severity: "caution",
        evidence: url.pathname.slice(0, 80),
      }),
    );
  }

  if (isShortenerHost(hostname)) {
    findings.push(
      finding({
        code: "url_shortener",
        weight: WEIGHTS.urlShortener,
        group: "shortener",
        severity: "caution",
        evidence: hostname,
      }),
    );
  }

  if (url.username || url.password) {
    findings.push(
      finding({
        code: "embedded_credentials",
        weight: WEIGHTS.embeddedCredentials,
        group: "credentials",
        severity: "warning",
      }),
    );
  }

  const sensitive = sensitiveQueryKeys(url);
  if (sensitive.length > 0) {
    findings.push(
      finding({
        code: "sensitive_query",
        weight: WEIGHTS.sensitiveQuery,
        group: "credentials",
        severity: "warning",
        evidence: sensitive.join(", "),
      }),
    );
  }

  const { score, indicators } = aggregate(findings);
  const queryKeys = [...url.searchParams.keys()].slice(0, 20).map((key) => key.slice(0, 40));

  return {
    ok: true,
    analysis: {
      kind: "url",
      riskCategory: categoryForScore(score),
      score,
      scoreSource: "heuristic_rules",
      indicators,
      recommendationCodes: recommendationCodes(
        indicators.map((indicator) => indicator.code),
        "url",
        score,
      ),
      limitationCodes: limitationCodes("url"),
      highlightedPhrases: indicators.flatMap((indicator) => (indicator.evidence ? [indicator.evidence] : [])),
      parsedUrl: {
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname,
        pathname: url.pathname || "/",
        port: url.port || null,
        queryKeys,
        missingScheme,
      },
    },
  };
}
