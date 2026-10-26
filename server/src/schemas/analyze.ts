import { z } from "zod";

export const messageRequestSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  consentToAi: z.boolean().optional().default(false),
  language: z.enum(["en", "ta"]).optional().default("en"),
});

export const urlRequestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  consentToAi: z.boolean().optional().default(false),
  language: z.enum(["en", "ta"]).optional().default("en"),
});

export type MessageRequest = z.infer<typeof messageRequestSchema>;
export type UrlRequest = z.infer<typeof urlRequestSchema>;
