import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { firstUnnegatedMatch } from "./text.js";

const THREAT =
  /\b(account (?:will be |is )?(?:suspended|blocked|closed|locked|terminated|disabled)|legal action|arrest warrant|police complaint)\b|கணக்கு[\s\S]{0,40}(?:முடக்க|இடைநிறுத்த|பூட்ட)|கைது|சட்ட நடவடிக்கை/i;

export function detectAccountThreat(text: string): Finding | null {
  const evidence = firstUnnegatedMatch(text, THREAT);
  if (!evidence) return null;
  return {
    code: "account_threat",
    weight: WEIGHTS.accountThreat,
    group: "pressure",
    severity: "warning",
    evidence,
  };
}
