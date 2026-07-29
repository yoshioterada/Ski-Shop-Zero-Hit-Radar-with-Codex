import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: ["node_modules/**", ".next/**", "test/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/layout.tsx",
        "src/app/**/page.tsx",
        "src/**/*.module.css",
      ],
      thresholds: {
        lines: 80,
        branches: 80,
      },
    },
    environment: "node",
    setupFiles: ["./test/setup.ts"],
  },
});
