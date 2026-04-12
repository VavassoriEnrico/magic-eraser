import react from "@vitejs/plugin-react";
import { defineConfig as defineVitestConfig } from "vitest/config";

export default defineVitestConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  }
});


