export interface Brand {
  id: string;
  parts: string[];
  official: string[];
}

export const BRANDS: Brand[] = [
  { id: "paypal", parts: ["paypal"], official: ["paypal.com"] },
  { id: "google", parts: ["google"], official: ["google.com", "google.co.in"] },
  { id: "microsoft", parts: ["microsoft"], official: ["microsoft.com", "live.com", "office.com"] },
  { id: "amazon", parts: ["amazon"], official: ["amazon.com", "amazon.in"] },
  { id: "apple", parts: ["apple", "icloud"], official: ["apple.com", "icloud.com"] },
  { id: "sbi", parts: ["sbi", "onlinesbi"], official: ["sbi.co.in", "onlinesbi.sbi"] },
  { id: "hdfc", parts: ["hdfc", "hdfcbank"], official: ["hdfcbank.com"] },
  { id: "icici", parts: ["icici", "icicibank"], official: ["icicibank.com"] },
  { id: "paytm", parts: ["paytm"], official: ["paytm.com"] },
  { id: "phonepe", parts: ["phonepe"], official: ["phonepe.com"] },
  { id: "flipkart", parts: ["flipkart"], official: ["flipkart.com"] },
  { id: "whatsapp", parts: ["whatsapp"], official: ["whatsapp.com"] },
  { id: "facebook", parts: ["facebook"], official: ["facebook.com", "fb.com"] },
  { id: "instagram", parts: ["instagram"], official: ["instagram.com"] },
];

const MULTI_PART_SUFFIXES = new Set(["co.in", "org.in", "net.in", "ac.in", "gov.in", "co.uk", "com.au"]);

export function registrableDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && labels.length >= 3) return labels.slice(-3).join(".");
  return lastTwo;
}

export function isOfficialDomain(hostname: string): boolean {
  const registrable = registrableDomain(hostname);
  return BRANDS.some((brand) => brand.official.includes(registrable));
}
