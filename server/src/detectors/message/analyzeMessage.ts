import { limitationCodes, recommendationCodes } from "../recommendations.js";
import { aggregate, categoryForScore } from "../scoring.js";
import type { EngineOutcome, Finding } from "../types.js";
import { MESSAGE_LIMIT } from "../weights.js";
import { detectAppInstall } from "./appInstall.js";
import { detectCredentialRequest } from "./credentials.js";
import { detectImpersonation } from "./impersonation.js";
import { detectInsecureLink, detectShortUrl } from "./links.js";
import { detectPrizeOrJobFee } from "./prizeFee.js";
import { normalizeForDetection } from "./text.js";
import { detectAccountThreat } from "./threats.js";
import { detectPaymentRequest, detectVerificationTransfer } from "./transfers.js";
import { detectUrgency } from "./urgency.js";

export function analyzeMessage(input: string): EngineOutcome {
  if (input.trim().length === 0) return { ok: false, error: "empty" };
  if (input.length > MESSAGE_LIMIT) return { ok: false, error: "too_long" };

  const text = normalizeForDetection(input);
  const findings = [
    detectUrgency(text),
    detectAccountThreat(text),
    detectCredentialRequest(text),
    detectVerificationTransfer(text),
    detectPaymentRequest(text),
    detectPrizeOrJobFee(text),
    detectImpersonation(text),
    detectShortUrl(text),
    detectInsecureLink(text),
    detectAppInstall(text),
  ].filter((finding): finding is Finding => finding !== null);

  const { score, indicators } = aggregate(findings);
  return {
    ok: true,
    analysis: {
      kind: "message",
      riskCategory: categoryForScore(score),
      score,
      scoreSource: "heuristic_rules",
      indicators,
      recommendationCodes: recommendationCodes(
        indicators.map((indicator) => indicator.code),
        "message",
        score,
      ),
      limitationCodes: limitationCodes("message"),
      highlightedPhrases: indicators.flatMap((indicator) => (indicator.evidence ? [indicator.evidence] : [])),
    },
  };
}
