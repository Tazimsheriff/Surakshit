import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { resolveDataFile } from "../lib/dataPath.js";
import { analyzeUrl } from "../detectors/url/analyzeUrl.js";
import { URL_LIMIT } from "../detectors/weights.js";

interface UrlSample {
  id: string;
  url: string;
  expectedCategory?: string;
  expectedIndicators?: string[];
  expectedError?: string;
}

describe("URL detection", () => {
  it("does not fetch the submitted URL", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const outcome = analyzeUrl("http://203.0.113.50/paypal-verify");
    expect(outcome.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps a normal HTTPS URL in the low band without calling it safe", () => {
    const outcome = analyzeUrl("https://www.wikipedia.org/wiki/Phishing");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.score).toBe(0);
    expect(outcome.analysis.riskCategory).toBe("low");
    expect(outcome.analysis.limitationCodes).toContain("https_not_trust");
    expect(outcome.analysis.recommendationCodes).toContain("result_is_not_proof");
  });

  it("flags an IP host without opening it", () => {
    const outcome = analyzeUrl("https://192.0.2.20/notice");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.riskCategory).toBe("medium");
    expect(outcome.analysis.indicators.map((indicator) => indicator.code)).toEqual(["ip_hostname"]);
    expect(outcome.analysis.parsedUrl?.hostname).toBe("192.0.2.20");
  });

  it("treats a shortener as a caution, not as confirmed fraud", () => {
    const outcome = analyzeUrl("https://bit.ly/surakshit-sample");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.riskCategory).toBe("low");
    expect(outcome.analysis.indicators.map((indicator) => indicator.code)).toEqual(["url_shortener"]);
  });

  it("does not echo embedded secrets", () => {
    const secret = "s3cret-value";
    const user = "alice-sample";
    const outcome = analyzeUrl(`https://${user}:${secret}@example.com/reset?password=${secret}`);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const serialized = JSON.stringify(outcome.analysis);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain(user);
    expect(outcome.analysis.indicators.map((indicator) => indicator.code)).toEqual(
      expect.arrayContaining(["embedded_credentials", "sensitive_query"]),
    );
  });

  it("rejects malformed, unsupported, empty, and oversized URLs", () => {
    expect(analyzeUrl("   ")).toEqual({ ok: false, error: "empty" });
    expect(analyzeUrl("http://")).toEqual({ ok: false, error: "malformed" });
    expect(analyzeUrl("javascript:alert(1)")).toEqual({ ok: false, error: "unsupported_scheme" });
    expect(analyzeUrl(`https://example.com/${"a".repeat(URL_LIMIT)}`)).toEqual({ ok: false, error: "too_long" });
  });

  it("matches the documented URL samples", () => {
    const file = JSON.parse(readFileSync(resolveDataFile("sample_messages.json"), "utf8")) as { urls: UrlSample[] };
    for (const sample of file.urls) {
      const outcome = analyzeUrl(sample.url);
      if (sample.expectedError) {
        expect(outcome, sample.id).toEqual({ ok: false, error: sample.expectedError });
        continue;
      }
      expect(outcome.ok, sample.id).toBe(true);
      if (!outcome.ok) continue;
      expect(outcome.analysis.indicators.map((indicator) => indicator.code).sort(), sample.id).toEqual(
        [...(sample.expectedIndicators ?? [])].sort(),
      );
      expect(outcome.analysis.riskCategory, sample.id).toBe(sample.expectedCategory);
    }
  });
});
