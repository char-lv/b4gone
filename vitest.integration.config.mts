import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Database/API integration tests run in Node against TEST_DATABASE_URL only (see docs/setup.md).
// Variables come from .env.local; values already set in the shell, such as CI's, take priority.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    // Suites share one test database, so files run one at a time.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
}));
