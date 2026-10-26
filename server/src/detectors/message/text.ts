import { sanitizeSnippet } from "../scoring.js";

export function normalizeForDetection(text: string): string {
  return text.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function windowIsNegated(text: string, start: number, end: number): boolean {
  const slice = text.slice(Math.max(0, start - 48), Math.min(text.length, end + 24));
  return /\b(do not|don't|never|avoid)\b/i.test(slice) || /வேண்டாம்|கூடாது/.test(slice);
}

export function firstUnnegatedMatch(text: string, pattern: RegExp): string | null {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const global = new RegExp(pattern.source, flags);
  for (const match of text.matchAll(global)) {
    const value = match[0];
    const start = match.index ?? 0;
    if (!windowIsNegated(text, start, start + value.length)) return sanitizeSnippet(value);
  }
  return null;
}
