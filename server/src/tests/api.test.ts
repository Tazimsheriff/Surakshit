import { describe, expect, it } from "vitest";
import request from "supertest";
import { createTestApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createMemoryStore } from "../services/analyticsStore.js";

describe("analysis API", () => {
  it("reports health without secrets", async () => {
    const app = createTestApp({
      config: loadConfig({
        AI_API_KEY: "sk-test-should-not-leak",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-should-not-leak",
        SUPABASE_URL: "",
      }),
    });
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true, service: "surakshit-api", aiConfigured: true, persistence: "memory" });
    expect(JSON.stringify(response.body)).not.toContain("sk-test-should-not-leak");
    expect(JSON.stringify(response.body)).not.toContain("service-role-should-not-leak");
  });

  it("rejects an empty message and an invalid URL", async () => {
    const app = createTestApp();
    const empty = await request(app).post("/api/analyze/message").send({ text: "   ", consentToAi: false, language: "en" });
    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe("validation_error");

    const malformed = await request(app).post("/api/analyze/url").send({ url: "http://", consentToAi: false, language: "ta" });
    expect(malformed.status).toBe(422);
    expect(malformed.body.error.code).toBe("invalid_url");
  });

  it("rejects an oversized message", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/api/analyze/message")
      .send({ text: "a".repeat(4001), consentToAi: false, language: "en" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
  });

  it("returns a rule score and does not store the message", async () => {
    const store = createMemoryStore();
    const app = createTestApp({ store });
    const text = "SBI alert: share the OTP 948271 immediately or the account will be blocked.";
    const response = await request(app).post("/api/analyze/message").send({ text, consentToAi: false, language: "ta" });
    expect(response.status).toBe(200);
    expect(response.body.result.scoreSource).toBe("heuristic_rules");
    expect(response.body.result.ai).toEqual({ used: false, reason: "no_consent" });
    expect(response.body.result.riskCategory).toBe("high");
    const summary = await request(app).get("/api/analytics/summary");
    const serialized = JSON.stringify(summary.body);
    expect(summary.body.summary.illustrative).toBe(false);
    expect(summary.body.summary.mode).toBe("session");
    expect(serialized).not.toContain("948271");
    expect(serialized).not.toContain("share the OTP");
  });

  it("does not store or return a URL password", async () => {
    const app = createTestApp();
    const secret = "s3cret-value";
    const response = await request(app)
      .post("/api/analyze/url")
      .send({ url: `https://alice-sample:${secret}@example.com/a?password=${secret}`, consentToAi: false, language: "en" });
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain(secret);
    expect(JSON.stringify(response.body)).not.toContain("alice-sample");
    const summary = await request(app).get("/api/analytics/summary");
    expect(JSON.stringify(summary.body)).not.toContain(secret);
  });

  it("labels an empty session as illustrative demo data", async () => {
    const app = createTestApp();
    const response = await request(app).get("/api/analytics/summary");
    expect(response.status).toBe(200);
    expect(response.body.summary).toMatchObject({ mode: "demo", illustrative: true, disclaimer: "illustrative_demo" });
  });

  it("serves learning modules", async () => {
    const app = createTestApp();
    const response = await request(app).get("/api/learning/modules");
    expect(response.status).toBe(200);
    expect(response.body.modules).toHaveLength(6);
    expect(response.body.modules.map((module: { id: string }) => module.id)).toEqual([
      "phishing",
      "otp-upi",
      "impersonation",
      "jobs-prizes",
      "qr-payments",
      "account-recovery",
    ]);
  });

  it("rate limits repeated analysis", async () => {
    const app = createTestApp({ rateLimitMax: 3 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await request(app)
        .post("/api/analyze/message")
        .send({ text: "The library closes at 6.", consentToAi: false, language: "en" });
      expect(response.status).toBe(200);
    }
    const blocked = await request(app)
      .post("/api/analyze/message")
      .send({ text: "The library closes at 6.", consentToAi: false, language: "en" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("rate_limited");
  });

  it("rejects invalid JSON without leaking a parser message", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/api/analyze/message")
      .set("Content-Type", "application/json")
      .send("{");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("invalid_json");
    expect(JSON.stringify(response.body)).not.toContain("Unexpected");
  });
});
