import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-server",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 15_000,
    setupFiles: ["./src/test/setup.ts"],
  },
});
