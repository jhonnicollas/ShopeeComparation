import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    include: ["{apps,workers,packages}/**/*.{test,spec}.{ts,tsx}"],
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["workers/**/*.{test,spec}.{ts,tsx}", "packages/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        test: {
          name: "browser",
          environment: "jsdom",
          setupFiles: ["./apps/web/src/test-setup.ts"],
          include: ["apps/**/*.{test,spec}.{ts,tsx}"],
        },
      },
    ],
  },
});
