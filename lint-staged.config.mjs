export default {
  "{apps,packages}/**/*.{ts,tsx}": ["eslint --fix --max-warnings 0 --no-warn-ignored"],
  "**/*.{ts,tsx,md,json}": ["prettier --write"],
};
