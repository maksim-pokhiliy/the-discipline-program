export const BLOG_CONSTANTS = {
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 200,
  MIN_EXCERPT_LENGTH: 1,
  MAX_EXCERPT_LENGTH: 500,
  MIN_CONTENT_LENGTH: 100,
  DEFAULT_SORT_ORDER: 0,
} as const;

export enum BlogCategory {
  FITNESS = "Fitness",
  NUTRITION = "Nutrition",
  MINDSET = "Mindset",
  TRAINING = "Training",
  RECOVERY = "Recovery",
}

export const BLOG_DEFAULTS = {
  isPublished: false,
  isFeatured: false,
  coverImage: null,
  publishedAt: null,
  readTime: null,
} as const;

export enum BlogToggleField {
  IS_PUBLISHED = "isPublished",
  IS_FEATURED = "isFeatured",
}
