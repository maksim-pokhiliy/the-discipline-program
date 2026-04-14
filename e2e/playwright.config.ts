import dotenv from "dotenv";
import path from "path";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const IS_CI = !!process.env.CI;

const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL!,
  SKIP_ENV_VALIDATION: "1",
};

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
        storageState: ".auth/admin.json",
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
        storageState: ".auth/platform-coach.json",
      },
    },
  ],

  webServer: [
    {
      command: "pnpm --filter marketing dev",
      url: "http://localhost:3000",
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
      env: serverEnv,
    },
    {
      command: "pnpm --filter admin dev",
      url: "http://localhost:3002",
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
      env: serverEnv,
    },
    {
      command: "pnpm --filter platform dev",
      url: "http://localhost:3001",
      reuseExistingServer: !IS_CI,
      timeout: 120_000,
      env: serverEnv,
    },
  ],
});
