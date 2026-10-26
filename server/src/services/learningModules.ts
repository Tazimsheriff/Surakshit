import { readFileSync } from "node:fs";
import { z } from "zod";
import { resolveDataFile } from "../lib/dataPath.js";

const localized = z.object({ en: z.string().min(1), ta: z.string().min(1) });

const moduleSchema = z.object({
  id: z.string().min(1),
  minutes: z.number().int().positive(),
  title: localized,
  summary: localized,
  explanation: localized,
  warningSigns: z.array(localized).min(2),
  example: localized,
  safeActions: z.array(localized).min(2),
  quiz: z
    .array(
      z.object({
        id: z.string().min(1),
        prompt: localized,
        choices: z.array(localized).min(2),
        correctIndex: z.number().int().nonnegative(),
        explanation: localized,
      }),
    )
    .min(2),
});

const fileSchema = z.object({ modules: z.array(moduleSchema).min(1) });

export type LearningModule = z.infer<typeof moduleSchema>;

let cached: LearningModule[] | null = null;

export function loadLearningModules(): LearningModule[] {
  if (cached) return cached;
  const raw = readFileSync(resolveDataFile("learning_modules.json"), "utf8");
  const parsed = fileSchema.parse(JSON.parse(raw));
  for (const learningModule of parsed.modules) {
    for (const question of learningModule.quiz) {
      if (question.correctIndex >= question.choices.length) {
        throw new Error(`Quiz answer out of range for ${learningModule.id}/${question.id}`);
      }
    }
  }
  cached = parsed.modules;
  return cached;
}
