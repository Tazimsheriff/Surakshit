import fallback from "../../../data/learning_modules.json";
import sampleData from "../../../data/sample_messages.json";
import { fetchModules } from "./api";
import type { LearningModule } from "../types";

export const messageSamples = sampleData.messages.map((item) => item.text);
export const urlSamples = sampleData.urls.filter((item) => !("expectedError" in item && item.expectedError)).map((item) => item.url);

export async function loadModules(): Promise<LearningModule[]> {
  try {
    const response = await fetchModules();
    if (response.modules.length > 0) return response.modules;
  } catch {
    // The bundled lessons keep the learning center usable when the API is down.
  }
  return fallback.modules as LearningModule[];
}
