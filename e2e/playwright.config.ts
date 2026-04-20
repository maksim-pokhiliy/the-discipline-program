import dotenv from "dotenv";
import path from "path";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const IS_CI = !!process.env.CI;

const sharedEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  SKIP_ENV_VALIDATION: "1",
  NEXT_PUBLIC_MARKETING_URL: "http://localhost:3000",
};

const appEnv = (port: number) => ({
  ...sharedEnv,
  NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
  NEXTAUTH_URL: `http://localhost:${port}`,
});

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [["html"], ["github"]] : [["html"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  projects: [
    {
      name: "marketing",
      testDir: "./marketing",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
        reducedMotion: "reduce",
      },
    },
    {
      name: "admin-setup",
      testDir: "./admin",
      testMatch: "auth.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
    },
    {
      name: "admin",
      testDir: "./admin",
      testMatch: /^(?!.*auth\.spec\.ts).*\.spec\.ts$/,
      dependencies: ["admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
        storageState: "e2e/.auth/admin.json",
      },
    },
    {
      name: "platform-setup",
      testDir: "./platform",
      testMatch: "auth.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "platform",
      testDir: "./platform",
      testMatch: /^(?!.*auth\.spec\.ts).*\.spec\.ts$/,
      dependencies: ["platform-setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        storageState: "e2e/.auth/platform-coach.json",
      },
    },
    {
      name: "empty-admin-setup",
      testDir: "./empty-db/admin",
      testMatch: "auth.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
    },
    {
      name: "empty-admin",
      testDir: "./empty-db/admin",
      testMatch: /.*\.empty\.spec\.ts$/,
      dependencies: ["empty-admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
        storageState: "e2e/.auth/admin-empty.json",
      },
    },
    {
      name: "empty-platform-coach-setup",
      testDir: "./empty-db/platform",
      testMatch: "auth.coach.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "empty-platform-coach",
      testDir: "./empty-db/platform",
      testMatch: /.*\.coach\.empty\.spec\.ts$/,
      dependencies: ["empty-platform-coach-setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        storageState: "e2e/.auth/coach-empty.json",
      },
    },
    {
      name: "empty-platform-athlete-setup",
      testDir: "./empty-db/platform",
      testMatch: "auth.athlete.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "empty-platform-athlete",
      testDir: "./empty-db/platform",
      testMatch: /.*\.athlete\.empty\.spec\.ts$/,
      dependencies: ["empty-platform-athlete-setup"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        storageState: "e2e/.auth/athlete-empty.json",
      },
    },
    {
      name: "empty-marketing",
      testDir: "./empty-db/marketing",
      testMatch: /.*\.empty\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
        reducedMotion: "reduce",
      },
    },
    {
      name: "bootstrapped-marketing",
      testDir: "./bootstrapped-db/marketing",
      testMatch: /.*\.bootstrap\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
        reducedMotion: "reduce",
      },
    },
  ],

  webServer: [
    {
      command: "pnpm --filter marketing dev",
      url: "http://localhost:3000",
      reuseExistingServer: !IS_CI,
      timeout: 240_000,
      env: appEnv(3000),
    },
    {
      command: "pnpm --filter admin dev",
      url: "http://localhost:3002",
      reuseExistingServer: !IS_CI,
      timeout: 240_000,
      env: appEnv(3002),
    },
    {
      command: "pnpm --filter platform dev",
      url: "http://localhost:3001",
      reuseExistingServer: !IS_CI,
      timeout: 240_000,
      env: appEnv(3001),
    },
  ],
});
