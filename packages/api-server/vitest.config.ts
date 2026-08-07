import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-server",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_MARKETING_URL: "http://localhost:3001",
      NEXT_PUBLIC_PLATFORM_URL: "http://localhost:3002",
      INVITE_TOKEN_TTL_HOURS: "72",
      MOBILE_PUBLISH_ENCRYPTION_KEY: "BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=",
      LEGACY_MOBILE_API_BASE_URL: "http://localhost:8080/api/v1",
      MOBILE_SHIM_JWT_SECRET: "test-only-mobile-shim-secret-000000000000",
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
