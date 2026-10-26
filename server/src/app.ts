import cors from "cors";
import express from "express";
import helmet from "helmet";
import { aiConfigured, loadConfig, supabaseConfigured, type AppConfig } from "./config.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { createAnalyzeLimiter } from "./middleware/rateLimit.js";
import { messageRequestSchema, urlRequestSchema } from "./schemas/analyze.js";
import { performMessageAnalysis, performUrlAnalysis } from "./services/analysisService.js";
import { createMemoryStore, defaultStore, type AnalyticsStore } from "./services/analyticsStore.js";
import { loadLearningModules } from "./services/learningModules.js";
import { createSupabaseStore } from "./services/supabaseAnalytics.js";

export interface AppDeps {
  config?: AppConfig;
  store?: AnalyticsStore;
  rateLimitMax?: number;
  fetchImpl?: typeof fetch;
}

function originSetting(value: string): boolean | string | string[] {
  if (value.trim() === "*") return true;
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.length === 1 ? parts[0] ?? false : parts;
}

export function createApp(deps: AppDeps = {}) {
  const config = deps.config ?? loadConfig();
  const fetchImpl = deps.fetchImpl ?? fetch;
  const store = deps.store ?? (supabaseConfigured(config) ? createSupabaseStore(config, fetchImpl) : defaultStore);
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: originSetting(config.corsOrigin),
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  if (process.env.NODE_ENV !== "test") {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on("finish", () => {
        console.log(
          JSON.stringify({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            ms: Date.now() - started,
          }),
        );
      });
      next();
    });
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "surakshit-api",
      aiConfigured: aiConfigured(config),
      persistence: store.persistence(),
    });
  });

  const limiter = createAnalyzeLimiter(deps.rateLimitMax ?? config.rateLimitMax);

  app.post("/api/analyze/message", limiter, async (req, res, next) => {
    try {
      const body = messageRequestSchema.parse(req.body);
      const result = await performMessageAnalysis(body, config, store, fetchImpl);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/analyze/url", limiter, async (req, res, next) => {
    try {
      const body = urlRequestSchema.parse(req.body);
      const outcome = await performUrlAnalysis(body, config, store, fetchImpl);
      res.status(outcome.status).json(outcome.body);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/analytics/summary", async (_req, res, next) => {
    try {
      const summary = await store.summary();
      res.json({ ok: true, summary });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/learning/modules", (_req, res, next) => {
    try {
      res.json({ ok: true, modules: loadLearningModules() });
    } catch (error) {
      next(error);
    }
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export function createTestApp(overrides: AppDeps = {}) {
  return createApp({
    store: createMemoryStore(),
    config: loadConfig({
      ...process.env,
      AI_API_KEY: "",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    }),
    ...overrides,
  });
}
