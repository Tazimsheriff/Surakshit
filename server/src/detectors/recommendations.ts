import type { RuleAnalysis } from "./types.js";

const BY_INDICATOR: Record<string, string[]> = {
  credential_request: ["do_not_share_codes", "use_official_channel"],
  verification_transfer: ["do_not_pay_to_unlock", "use_official_channel"],
  payment_request: ["do_not_approve_unexpected_payments", "use_official_channel"],
  prize_or_job_fee: ["do_not_pay_fees_for_prizes"],
  app_install: ["do_not_install_unknown_apps", "do_not_share_codes"],
  account_threat: ["pause_and_verify", "use_official_channel"],
  urgency: ["pause_and_verify"],
  impersonation: ["use_official_channel"],
  short_url: ["do_not_open_unexpected_links", "treat_short_links_as_unverified"],
  insecure_link: ["do_not_open_unexpected_links"],
  url_shortener: ["treat_short_links_as_unverified"],
  insecure_http: ["prefer_https_context"],
  missing_scheme: ["check_domain_carefully"],
  ip_hostname: ["avoid_ip_links"],
  excessive_subdomains: ["check_domain_carefully"],
  brand_impersonation: ["check_domain_carefully", "use_official_channel"],
  lookalike_domain: ["check_domain_carefully"],
  punycode_host: ["check_domain_carefully"],
  deceptive_path: ["check_domain_carefully"],
  unusual_port: ["avoid_unusual_ports"],
  excessive_length: ["check_domain_carefully"],
  embedded_credentials: ["do_not_use_urls_with_passwords"],
  sensitive_query: ["do_not_use_urls_with_passwords"],
};

export function recommendationCodes(
  indicatorCodes: string[],
  kind: RuleAnalysis["kind"],
  score: number,
): string[] {
  const codes = new Set<string>();
  for (const indicator of indicatorCodes) {
    for (const recommendation of BY_INDICATOR[indicator] ?? []) codes.add(recommendation);
  }
  if (score >= 50) codes.add("report_to_cybercrime");
  if (score < 25) codes.add(kind === "url" ? "low_url_still_check" : "low_message_still_check");
  else codes.add("pause_and_verify");
  codes.add("result_is_not_proof");
  return [...codes];
}

export function limitationCodes(kind: RuleAnalysis["kind"]): string[] {
  const codes = [
    "heuristic_not_proof",
    "legitimate_overlap",
    "absence_not_safety",
    "no_url_visit",
    "rules_not_a_model",
  ];
  if (kind === "url") codes.push("https_not_trust");
  return codes;
}
