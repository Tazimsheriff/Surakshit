import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { sanitizeSnippet } from "../scoring.js";

const ORG =
  /\b(sbi|state bank|hdfc|icici|axis bank|paypal|amazon|flipkart|fedex|dhl|bluedart|income tax|uidai|aadhaar|aadhar|rbi|customs|microsoft|paytm|phonepe|google pay|whatsapp|customer care|customer support|tech support)\b|வருமான வரி|ஆதார்|வாடிக்கையாளர் சேவை|வங்கி/i;

export function detectImpersonation(text: string): Finding | null {
  const match = text.match(ORG);
  if (!match) return null;
  return {
    code: "impersonation",
    weight: WEIGHTS.impersonation,
    group: "identity",
    severity: "info",
    evidence: sanitizeSnippet(match[0]),
  };
}
