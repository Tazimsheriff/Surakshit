const KEY = "surakshit.quiz";

export interface QuizRecord {
  score: number;
  total: number;
  updatedAt: string;
}

export function readQuiz(): Record<string, QuizRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, QuizRecord>;
  } catch {
    return {};
  }
}

export function writeQuiz(moduleId: string, score: number, total: number): QuizRecord {
  const all = readQuiz();
  const next: QuizRecord = { score, total, updatedAt: new Date().toISOString() };
  const previous = all[moduleId];
  if (!previous || score >= previous.score) all[moduleId] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[moduleId] ?? next;
}

export function clearQuiz(): void {
  localStorage.removeItem(KEY);
}
