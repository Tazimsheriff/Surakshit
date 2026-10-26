import type { EngineErrorCode } from "../types.js";
import { URL_LIMIT } from "../weights.js";

function hasUnsafeUrlCharacter(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 32 || code === 127) return true;
  }
  return false;
}

export interface ParsedInputUrl {
  url: URL;
  missingScheme: boolean;
}

export function parseUserUrl(
  input: string,
): { ok: true; parsed: ParsedInputUrl } | { ok: false; error: EngineErrorCode } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed.length > URL_LIMIT) return { ok: false, error: "too_long" };
  if (hasUnsafeUrlCharacter(trimmed)) return { ok: false, error: "malformed" };

  let missingScheme = false;
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    missingScheme = true;
    candidate = `https://${trimmed}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, error: "malformed" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "unsupported_scheme" };
  }
  if (!url.hostname) return { ok: false, error: "malformed" };
  return { ok: true, parsed: { url, missingScheme } };
}
