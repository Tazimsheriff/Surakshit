import { describe, expect, it } from "vitest";
import { splitHighlight } from "../lib/highlight";
import { buildSummary } from "../lib/summary";
import { en } from "../i18n/en";
import type { AnalysisResult } from "../types";

describe("highlighting", () => {
  it("marks a phrase without treating markup as HTML", () => {
    const parts = splitHighlight("<img src=x onerror=alert(1)> share the OTP", ["share the OTP"]);
    expect(parts.some((part) => part.match && part.text.toLowerCase() === "share the otp")).toBe(true);
    expect(parts.map((part) => part.text).join("")).toContain("<img");
  });

  it("prefers the longer phrase when two overlap", () => {
    const parts = splitHighlight("Please share the OTP now", ["OTP", "share the OTP"]);
    expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual(["share the OTP"]);
  });
});

describe("copy summary", () => {
  it("omits the submitted message", () => {
    const result: AnalysisResult = {
      kind: "message",
      riskCategory: "high",
      score: 66,
      scoreSource: "heuristic_rules",
      indicators: [{ code: "credential_request", appliedWeight: 30, severity: "warning", evidence: "share the OTP 948271" }],
      recommendationCodes: ["do_not_share_codes"],
      limitationCodes: ["heuristic_not_proof"],
      highlightedPhrases: ["share the OTP 948271"],
      ai: { used: false, reason: "no_consent" },
    };
    const summary = buildSummary(result, en);
    expect(summary).toContain("66/100");
    expect(summary).toContain(en.indicators.credential_request.title);
    expect(summary).not.toContain("948271");
    expect(summary).not.toContain("share the OTP");
  });
});
