import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["{apps,workers,packages}/**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: true
  }
});
