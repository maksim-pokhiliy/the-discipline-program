import { config } from "@repo/eslint-config/react";

export default [
  { ignores: ["storybook-static/**"] },
  ...config,
  {
    files: ["**/*.stories.tsx", "src/story-layout.tsx"],
    rules: {
      "react/no-multi-comp": "off",
    },
  },
];
