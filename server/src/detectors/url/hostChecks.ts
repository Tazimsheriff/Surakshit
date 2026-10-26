import { BRANDS, isOfficialDomain, registrableDomain } from "./brands.js";

const CONFUSABLES: Record<string, string[]> = {
  "0": ["o"],
  "1": ["l", "i"],
  "3": ["e"],
  "4": ["a"],
  "5": ["s"],
  "7": ["t"],
};

export function isIpHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "");
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4);
  if (match) return match.slice(1).every((part) => Number(part) <= 255);
  return host.includes(":") && /^[0-9a-f:]+$/i.test(host);
}

export function matchedBrandToken(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isOfficialDomain(host) || isIpHostname(host)) return null;
  const labels = host.split(".").filter((label) => label && label !== "www" && !label.startsWith("xn--"));
  for (const label of labels) {
    const tokens = label.split("-").filter(Boolean);
    for (const brand of BRANDS) {
      for (const part of brand.parts) {
        if (tokens.includes(part)) return part;
      }
    }
  }
  return null;
}

function homoglyphVariants(label: string): string[] {
  const lower = label.toLowerCase();
  let current = [lower];
  for (let index = 0; index < lower.length; index += 1) {
    const alternatives = CONFUSABLES[lower[index] ?? ""];
    if (!alternatives) continue;
    const added: string[] = [];
    for (const value of current) {
      for (const alternative of alternatives) {
        added.push(value.slice(0, index) + alternative + value.slice(index + 1));
      }
    }
    current = current.concat(added);
    if (current.length > 40) break;
  }
  return current;
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(current + 1, (row[j - 1] ?? 0) + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length] ?? 0;
}

export function lookalikeBrand(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isOfficialDomain(host) || isIpHostname(host)) return null;
  const label = registrableDomain(host).split(".")[0] ?? "";
  if (label.length < 4 || label.length > 30 || label.startsWith("xn--")) return null;

  for (const brand of BRANDS) {
    for (const part of brand.parts) {
      if (part.length < 4) continue;
      const variants = homoglyphVariants(label);
      if (variants.some((variant) => variant === part && variant !== label)) return part;
      if (part.length >= 6 && Math.abs(label.length - part.length) <= 1 && levenshtein(label, part) === 1) {
        return part;
      }
    }
  }
  return null;
}

const PATH_PHRASE = /(account-verify|secure-login|kyc-update|verify-account|free-prize|wallet-update)/i;
const PATH_ACTION = /(verify|login|signin|update|kyc|secure|wallet|password|unlock)/i;

export function hasDeceptivePath(url: URL): boolean {
  if (isOfficialDomain(url.hostname)) return false;
  const path = `${url.pathname}${url.hash}`;
  if (PATH_PHRASE.test(path)) return true;
  const mentionsBrand = BRANDS.some((brand) => brand.parts.some((part) => path.toLowerCase().includes(part)));
  return mentionsBrand && PATH_ACTION.test(path);
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "pin",
  "otp",
  "cvv",
  "secret",
  "token",
  "ssn",
  "aadhaar",
  "aadhar",
]);

export function sensitiveQueryKeys(url: URL): string[] {
  const keys: string[] = [];
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) keys.push(key.toLowerCase());
  }
  return keys.slice(0, 8);
}
