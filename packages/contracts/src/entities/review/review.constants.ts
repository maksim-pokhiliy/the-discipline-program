export const REVIEW_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 1000,
} as const;

export enum ReviewToggleField {
  IS_ACTIVE = "isActive",
}
