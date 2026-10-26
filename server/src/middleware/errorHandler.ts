import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ ok: false, error: { code: "not_found" } });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: "validation_error",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
        })),
      },
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ ok: false, error: { code: "invalid_json" } });
    return;
  }

  const typed = error as { status?: number; type?: string };
  if (typed.status === 413 || typed.type === "entity.too.large") {
    res.status(413).json({ ok: false, error: { code: "payload_too_large" } });
    return;
  }

  res.status(500).json({ ok: false, error: { code: "server_error" } });
}
