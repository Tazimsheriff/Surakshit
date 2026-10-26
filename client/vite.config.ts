import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
    fs: {
      allow: [path.resolve(root, "..")],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts",
  },
});
