import type { Finding } from "../types.js";
import { WEIGHTS } from "../weights.js";
import { sanitizeSnippet } from "../scoring.js";

const REMOTE = /\b(anydesk|teamviewer|quicksupport|rustdesk|remote access app)\b/i;
const GENERIC =
  /\b(?:install|download)\b[\s\S]{0,50}\b(?:app|apk|application|software)\b|\.apk\b|செயலியை\s*(?:நிறுவ|பதிவிறக்கு)/i;

export function detectAppInstall(text: string): Finding | null {
  const remote = text.match(REMOTE);
  if (remote) {
    return {
      code: "app_install",
      weight: WEIGHTS.appInstallRemote,
      group: "install",
      severity: "warning",
      evidence: sanitizeSnippet(remote[0]),
    };
  }
  const generic = text.match(GENERIC);
  if (!generic) return null;
  return {
    code: "app_install",
    weight: WEIGHTS.appInstallGeneric,
    group: "install",
    severity: "warning",
    evidence: sanitizeSnippet(generic[0]),
  };
}
