export const REVIEW_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_TEXT_LENGTH: 10,
  MAX_TEXT_LENGTH: 1000,
  DEFAULT_SORT_ORDER: 0,
} as const;

export const REVIEW_DEFAULTS = {
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  rating: 5,
  authorAvatar: null,
  programId: null,
} as const;

export const TOGGLE_FIELDS = ["isActive", "isFeatured"] as const;
