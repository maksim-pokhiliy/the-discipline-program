import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/api-client",
      "packages/api-server",
      "packages/api-routes",
      "packages/auth",
      "packages/contracts",
      "packages/shared",
      {
        plugins: [reactPlugin()],
        test: {
          name: "ui",
          root: "packages/ui",
          environment: "jsdom",
          globals: true,
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
      {
        plugins: [reactPlugin()],
        test: {
          name: "query",
          root: "packages/query",
          environment: "jsdom",
          globals: true,
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        },
      },
      {
        plugins: [reactPlugin()],
        test: {
          name: "platform",
          root: "apps/platform",
          environment: "jsdom",
          globals: true,
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "packages/api-server/src/**/*.ts",
        "packages/api-routes/src/**/*.ts",
        "packages/auth/src/**/*.ts",
        "packages/contracts/src/**/*.ts",
        "packages/shared/src/**/*.ts",
        "packages/ui/src/**/*.{ts,tsx}",
        "packages/query/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/test/**",
        "**/__tests__/**",
        "**/index.ts",
        "**/*.types.ts",
        "**/*.config.{ts,js,mjs,cjs}",
        "**/dist/**",
        "**/node_modules/**",
        "packages/api-server/prisma/**",
        "packages/api-server/src/generated/**",
      ],
      thresholds: {
        lines: 63,
        statements: 63,
        functions: 49,
        branches: 43,
      },
    },
  },
});
