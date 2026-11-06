import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "apps/web"),
      "@movie/auth": path.resolve(rootDir, "packages/auth/src/index.ts"),
      "@movie/config": path.resolve(rootDir, "packages/config/src/index.ts"),
      "@movie/contracts": path.resolve(rootDir, "packages/contracts/src/index.ts"),
      "@movie/db": path.resolve(rootDir, "packages/db/src/index.ts"),
      "@movie/domain": path.resolve(rootDir, "packages/domain/src/index.ts"),
      "@movie/observability": path.resolve(rootDir, "packages/observability/src/index.ts"),
      "@movie/storage": path.resolve(rootDir, "packages/storage/src/index.ts"),
      "server-only": path.resolve(rootDir, "vitest.server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.test.ts", "apps/web/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "tests/e2e/**"],
    clearMocks: true,
    restoreMocks: true,
  },
});
