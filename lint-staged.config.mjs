export default {
  "{apps,packages}/**/*.{ts,tsx}": ["eslint --fix --max-warnings 0"],
  "**/*.{ts,tsx,md,json}": ["prettier --write"],
};
