import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: [
      "packages/api-server/prisma/seed/_canonical/builder/**",
      "packages/api-server/prisma/seed/_canonical/validate.ts",
    ],
  },
];
