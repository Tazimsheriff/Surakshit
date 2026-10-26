import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { firstUnnegatedMatch } from "./text.js";

const URGENCY =
  /\b(act now|immediately|urgent|right now|last chance|do not delay|limited time|within\s+\d+\s*(?:minutes|hours))\b|உடனே|உடனடியாக|இன்றே|கடைசி வாய்ப்பு/i;

export function detectUrgency(text: string): Finding | null {
  const evidence = firstUnnegatedMatch(text, URGENCY);
  if (!evidence) return null;
  return {
    code: "urgency",
    weight: WEIGHTS.urgency,
    group: "pressure",
    severity: "caution",
    evidence,
  };
}
