import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-routes",
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
