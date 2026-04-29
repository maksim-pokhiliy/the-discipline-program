import { defineConfig } from "vitest/config";

import { SEQUENTIAL_TEST_FILES } from "./vitest.sequential-files";

export default defineConfig({
  test: {
    name: "api-server-sequential",
    globals: true,
    environment: "node",
    include: SEQUENTIAL_TEST_FILES,
    fileParallelism: false,
    testTimeout: 15_000,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_MARKETING_URL: "http://localhost:3001",
      NEXT_PUBLIC_PLATFORM_URL: "http://localhost:3002",
      INVITE_TOKEN_TTL_HOURS: "72",
    },
  },
});
