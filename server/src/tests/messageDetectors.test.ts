import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeMessage } from "../detectors/message/analyzeMessage.js";
import { categoryForScore } from "../detectors/scoring.js";
import { resolveDataFile } from "../lib/dataPath.js";
import { MESSAGE_LIMIT, WEIGHTS } from "../detectors/weights.js";

interface MessageSample {
  id: string;
  text: string;
  expectedCategory: string;
  expectedIndicators: string[];
}

function codes(text: string): string[] {
  const outcome = analyzeMessage(text);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.analysis.indicators.map((indicator) => indicator.code).sort();
}

describe("message detection", () => {
  it("scores an ordinary message as low", () => {
    const outcome = analyzeMessage("Hi, the study group will meet at 4 pm in the library. Please bring your notes.");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.score).toBe(0);
    expect(outcome.analysis.riskCategory).toBe("low");
    expect(outcome.analysis.scoreSource).toBe("heuristic_rules");
  });

  it("does not treat safety advice as a credential request", () => {
    expect(codes("Never share your OTP, PIN, or password with anyone, including people who claim to be from the bank.")).toEqual([]);
  });

  it("flags a request to share an OTP", () => {
    const outcome = analyzeMessage("Please share the OTP sent to your phone.");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.indicators.map((indicator) => indicator.code)).toContain("credential_request");
    expect(outcome.analysis.score).toBe(WEIGHTS.credentialHigh);
    expect(outcome.analysis.riskCategory).toBe(categoryForScore(WEIGHTS.credentialHigh));
  });

  it("keeps a wifi password request in the low band", () => {
    const outcome = analyzeMessage("Please share the wifi password with our guest before the meeting.");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.analysis.riskCategory).toBe("low");
    expect(outcome.analysis.score).toBe(WEIGHTS.credentialLow);
  });

  it("detects Tamil urgency, account pressure, and an OTP request", () => {
    expect(codes("உங்கள் வங்கிக் கணக்கு உடனடியாக முடக்கப்படும். OTP-ஐ இந்த எண்ணுக்கு அனுப்புங்கள்.")).toEqual([
      "account_threat",
      "credential_request",
      "impersonation",
      "urgency",
    ]);
  });

  it("still detects an OTP request when zero-width characters split the word", () => {
    expect(codes("Please share the OT\u200BP now.")).toContain("credential_request");
  });

  it("rejects empty and oversized messages", () => {
    expect(analyzeMessage("   ").ok).toBe(false);
    expect(analyzeMessage("a".repeat(MESSAGE_LIMIT + 1))).toEqual({ ok: false, error: "too_long" });
  });

  it("does not call the labeled samples fraudulent; it matches the documented bands", () => {
    const file = JSON.parse(readFileSync(resolveDataFile("sample_messages.json"), "utf8")) as { messages: MessageSample[] };
    expect(file.messages.length).toBeGreaterThanOrEqual(8);
    for (const sample of file.messages) {
      const outcome = analyzeMessage(sample.text);
      expect(outcome.ok, sample.id).toBe(true);
      if (!outcome.ok) continue;
      expect(outcome.analysis.indicators.map((indicator) => indicator.code).sort(), sample.id).toEqual(
        [...sample.expectedIndicators].sort(),
      );
      expect(outcome.analysis.riskCategory, sample.id).toBe(sample.expectedCategory);
      expect(JSON.stringify(outcome.analysis)).not.toContain(sample.text);
    }
  });
});
