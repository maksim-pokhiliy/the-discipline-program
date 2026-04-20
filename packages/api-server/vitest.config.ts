import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-server",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_MARKETING_URL: "http://localhost:3001",
      NEXT_PUBLIC_PLATFORM_URL: "http://localhost:3002",
      INVITE_TOKEN_TTL_HOURS: "72",
      FEATURE_USER_INVITE_ENABLED: "false",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/test/**", "src/**/*.test.ts"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
