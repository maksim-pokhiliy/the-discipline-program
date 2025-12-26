import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */

export default [
  ...nextJsConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message: "Do not use raw queryKey arrays. Use adminKeys/marketingKeys from @repo/query.",
        },
      ],
    },
  },
];
