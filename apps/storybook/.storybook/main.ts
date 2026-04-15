import { dirname } from "path";
import { fileURLToPath } from "url";

import type { StorybookConfig } from "@storybook/nextjs-vite";

const getAbsolutePath = (value: string) =>
  dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: getAbsolutePath("@storybook/nextjs-vite"),
};

export default config;
