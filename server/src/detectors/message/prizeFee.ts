import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { sanitizeSnippet } from "../scoring.js";

const LURE =
  /\b(?:you have won|you've won|you are (?:the )?winner|lottery prize|selected\b[\s\S]{0,60}\b(?:job|role|position|opening)|work[-\s]?from[-\s]?home position)\b|பரிசு வென்றுள்ளீர்கள்|லாட்டரி|வேலைக்கு தேர்வு/i;

const FEE =
  /\b(?:processing fee|registration fee|refundable deposit|activation fee|pay(?: a| the)? (?:processing |registration |refundable )?fee)\b|கட்டணம் செலுத்த|பதிவுக் கட்டணம்/i;

export function detectPrizeOrJobFee(text: string): Finding | null {
  const lure = text.match(LURE);
  const fee = text.match(FEE);
  if (!lure || !fee) return null;
  return {
    code: "prize_or_job_fee",
    weight: WEIGHTS.prizeOrJobFee,
    group: "lure",
    severity: "warning",
    evidence: sanitizeSnippet(`${lure[0]} / ${fee[0]}`),
  };
}
