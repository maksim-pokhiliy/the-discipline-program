import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/api-server",
      "packages/api-routes",
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
    ],
  },
});
