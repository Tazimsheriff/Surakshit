export interface AppConfig {
  port: number;
  corsOrigin: string;
  trustProxy: boolean;
  rateLimitMax: number;
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  aiTimeoutMs: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

function integer(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: integer(env.PORT, 4000),
    corsOrigin: env.CORS_ORIGIN?.trim() || "http://localhost:5173",
    trustProxy: env.TRUST_PROXY === "true",
    rateLimitMax: integer(env.RATE_LIMIT_MAX, 30),
    aiApiKey: env.AI_API_KEY?.trim() ?? "",
    aiModel: env.AI_MODEL?.trim() || "gpt-4o-mini",
    aiBaseUrl: (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
    aiTimeoutMs: integer(env.AI_TIMEOUT_MS, 8000),
    supabaseUrl: env.SUPABASE_URL?.trim().replace(/\/$/, "") ?? "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
}

export function aiConfigured(config: AppConfig): boolean {
  return config.aiApiKey.length > 0;
}

export function supabaseConfigured(config: AppConfig): boolean {
  return config.supabaseUrl.length > 0 && config.supabaseServiceRoleKey.length > 0;
}
