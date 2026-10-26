import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { firstUnnegatedMatch } from "./text.js";

const TRANSFER =
  /\b(?:transfer|send|deposit)\b[\s\S]{0,70}\b(?:verify|verification|unlock|reactivate|kyc)\b|\b(?:verify|unlock|reactivate)\b[\s\S]{0,70}\b(?:transfer|upi|payment)\b|(?:சரிபார்க்க|திறக்க)[\s\S]{0,40}(?:பணம் அனுப்ப|பரிமாற்ற)/i;

const COLLECT =
  /\b(?:upi|gpay|google pay|phonepe|paytm)\b[\s\S]{0,50}\b(?:approve|accept|collect request|payment request)\b|\b(?:approve|accept)\b[\s\S]{0,40}\b(?:collect request|payment request|upi request)\b/i;

export function detectVerificationTransfer(text: string): Finding | null {
  const evidence = firstUnnegatedMatch(text, TRANSFER);
  if (!evidence) return null;
  return {
    code: "verification_transfer",
    weight: WEIGHTS.verificationTransfer,
    group: "secrets",
    severity: "warning",
    evidence,
  };
}

export function detectPaymentRequest(text: string): Finding | null {
  const evidence = firstUnnegatedMatch(text, COLLECT);
  if (!evidence) return null;
  return {
    code: "payment_request",
    weight: WEIGHTS.paymentRequest,
    group: "secrets",
    severity: "warning",
    evidence,
  };
}
