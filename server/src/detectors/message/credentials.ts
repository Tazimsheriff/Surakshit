import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { firstUnnegatedMatch } from "./text.js";

const HIGH_SECRET =
  /\b(?:share|send|tell|give|enter|reply|forward|provide|dictate|confirm|whatsapp|read)\b[\s\S]{0,48}\b(?:otp|one[-\s]?time password|cvv|mpin|upi pin|atm pin|recovery code|verification code)\b|\b(?:otp|one[-\s]?time password|cvv|mpin|upi pin|atm pin|recovery code|verification code)\b[\s\S]{0,48}\b(?:share|send|tell|give|enter|reply|forward|provide|confirm)\b|(?:ஓடிபி|OTP|கடவுச்சொல்)[\s\S]{0,40}(?:அனுப்ப|பகிர|தெரிவி|சொல்ல)|(?:அனுப்ப|பகிர|தெரிவி|சொல்ல)[\s\S]{0,40}(?:ஓடிபி|OTP|கடவுச்சொல்)/i;

const PIN_REQUEST =
  /(?:share|send|tell|give|enter|reply|forward|provide|read)[\s\S]{0,40}\bPIN\b|\bPIN\b[\s\S]{0,40}(?:share|send|tell|give|enter|reply|forward|provide)/;

const PASSWORD_REQUEST =
  /\b(?:share|send|tell|give|enter|reply|forward|provide)\b[\s\S]{0,40}\b(?:password|passcode)\b|\b(?:password|passcode)\b[\s\S]{0,40}\b(?:share|send|tell|give|enter|reply|forward|provide)\b/i;

const HIGH_CONTEXT = /\b(bank|account|login|verify|verification|aadhaar|aadhar|otp|kyc|wallet)\b|வங்கி|ஆதார்|கணக்கு/i;

export function detectCredentialRequest(text: string): Finding | null {
  const high = firstUnnegatedMatch(text, HIGH_SECRET) ?? firstUnnegatedMatch(text, PIN_REQUEST);
  if (high) {
    return {
      code: "credential_request",
      weight: WEIGHTS.credentialHigh,
      group: "secrets",
      severity: "warning",
      evidence: high,
    };
  }

  const password = firstUnnegatedMatch(text, PASSWORD_REQUEST);
  if (!password) return null;
  const elevated = HIGH_CONTEXT.test(text);
  return {
    code: "credential_request",
    weight: elevated ? WEIGHTS.credentialHigh : WEIGHTS.credentialLow,
    group: "secrets",
    severity: elevated ? "warning" : "caution",
    evidence: password,
  };
}
