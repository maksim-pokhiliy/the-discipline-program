export const reactQueryConfig = [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message:
            "Use typed query keys from @repo/query (e.g. adminKeys/marketingKeys), not raw arrays.",
        },
      ],
    },
  },
];
