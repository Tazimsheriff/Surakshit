import type { Finding } from "../types.js";
import { isShortenerHost } from "../url/shorteners.js";
import { WEIGHTS } from "../weights.js";
import { sanitizeSnippet } from "../scoring.js";

const URL_IN_TEXT = /https?:\/\/[^\s<>"'`]+/gi;

export function extractMessageUrls(text: string): URL[] {
  const urls: URL[] = [];
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const raw = match[0].replace(/[.,;:!?)]+$/, "");
    try {
      const url = new URL(raw);
      if (url.protocol === "http:" || url.protocol === "https:") urls.push(url);
    } catch {
      continue;
    }
  }
  return urls;
}

export function detectShortUrl(text: string): Finding | null {
  for (const url of extractMessageUrls(text)) {
    if (isShortenerHost(url.hostname)) {
      return {
        code: "short_url",
        weight: WEIGHTS.shortUrl,
        group: "links",
        severity: "caution",
        evidence: sanitizeSnippet(url.origin),
      };
    }
  }
  return null;
}

export function detectInsecureLink(text: string): Finding | null {
  for (const url of extractMessageUrls(text)) {
    if (url.protocol === "http:") {
      return {
        code: "insecure_link",
        weight: WEIGHTS.insecureLink,
        group: "links",
        severity: "info",
        evidence: sanitizeSnippet(`${url.protocol}//${url.hostname}`),
      };
    }
  }
  return null;
}
