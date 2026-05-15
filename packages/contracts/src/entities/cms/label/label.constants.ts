export const LABEL_CONSTANTS = {
  MAX_NAME_LENGTH: 200,
  MAX_NOTES_LENGTH: 10_000,
} as const;

export const APP_LEVELS = ["DAY", "SESSION", "BLOCK"] as const;
export type AppLevelValue = (typeof APP_LEVELS)[number];
