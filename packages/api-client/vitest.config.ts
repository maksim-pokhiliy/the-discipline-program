import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-client",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
