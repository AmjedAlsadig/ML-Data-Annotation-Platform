import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {

     coverage: {
      provider: "v8",
      reporter: ["text", "html"],   // see coverage summary and HTML report
      reportsDirectory: "./coverage"
    },
    globals: true,
    environment: "jsdom", 
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend/src"),   
      "@backend": path.resolve(__dirname, "backend"), 
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
