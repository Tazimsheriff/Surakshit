import type { AnalysisResult, AnalyticsSummary, HealthStatus, LearningModule } from "../types";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function base(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

async function read<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, init);
  } catch {
    throw new ApiError("network", 0);
  }
  const payload = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
  if (!response.ok) throw new ApiError(payload?.error?.code ?? "server_error", response.status);
  return payload as T;
}

export function analyzeMessage(body: { text: string; consentToAi: boolean; language: "en" | "ta" }) {
  return read<{ ok: true; result: AnalysisResult }>("/api/analyze/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function analyzeUrl(body: { url: string; consentToAi: boolean; language: "en" | "ta" }) {
  return read<{ ok: true; result: AnalysisResult }>("/api/analyze/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function fetchSummary() {
  return read<{ ok: true; summary: AnalyticsSummary }>("/api/analytics/summary");
}

export function fetchModules() {
  return read<{ ok: true; modules: LearningModule[] }>("/api/learning/modules");
}

export function fetchHealth() {
  return read<HealthStatus>("/api/health");
}
