/**
 * Documented heuristic weights.
 *
 * A finding contributes points only inside its group. The strongest finding in a
 * group is counted in full, the next at half, and the rest at a quarter, up to
 * the group cap. The total is capped at 100.
 *
 * Bands: 0–24 low, 25–49 medium, 50–74 high, 75–100 critical.
 * These bands are estimates of how many scam-like patterns were found. They are
 * not a probability and they are not a determination of fraud.
 */
export const MESSAGE_LIMIT = 4000;
export const URL_LIMIT = 2048;

export const GROUP_CAPS = {
  pressure: 28,
  secrets: 56,
  lure: 52,
  identity: 12,
  links: 16,
  install: 40,
  transport: 14,
  host: 30,
  structure: 26,
  deception: 40,
  shortener: 14,
  credentials: 52,
} as const;

export type ScoreGroup = keyof typeof GROUP_CAPS;

export const WEIGHTS = {
  urgency: 16,
  accountThreat: 18,
  credentialHigh: 30,
  credentialLow: 18,
  verificationTransfer: 54,
  paymentRequest: 16,
  prizeOrJobFee: 52,
  impersonation: 10,
  shortUrl: 14,
  insecureLink: 8,
  appInstallRemote: 40,
  appInstallGeneric: 18,
  insecureHttp: 12,
  missingScheme: 6,
  ipHostname: 30,
  excessiveSubdomains: 14,
  unusualPort: 16,
  excessiveLength: 10,
  brandImpersonation: 32,
  lookalikeDomain: 30,
  punycodeHost: 16,
  deceptivePath: 12,
  urlShortener: 14,
  embeddedCredentials: 52,
  sensitiveQuery: 18,
} as const;
