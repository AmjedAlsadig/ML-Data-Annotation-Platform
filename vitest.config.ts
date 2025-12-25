import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],

      // ⬇⬇⬇ KLJUČNA STVAR ⬇⬇⬇
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",

        // backend – infra & boilerplate
        "backend/index.ts",
        "backend/routes.ts",
        "backend/adminRoutes.ts",
        "backend/swagger.ts",

        // middlewares
        "backend/middlewares/**",

        // services (external systems)
        "backend/services/**",

        // integration tests themselves
        "backend/tests/**",

        // frontend (ako ga ne testiraš)
        "frontend/**"
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend/src"),
      "@backend": path.resolve(__dirname, "backend"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
