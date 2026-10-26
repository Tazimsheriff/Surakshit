import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveDataFile(name: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../../data", name),
    path.resolve(here, "../../data", name),
    path.resolve(process.cwd(), "data", name),
    path.resolve(process.cwd(), "../data", name),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Unable to locate data file: ${name}`);
}
