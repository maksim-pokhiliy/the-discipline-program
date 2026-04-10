export const BLOG_CONSTANTS = {
  MIN_CONTENT_LENGTH: 100,
  WORDS_PER_MINUTE: 200,
} as const;

export enum BlogCategory {
  UNCATEGORIZED = "UNCATEGORIZED",
  FITNESS = "FITNESS",
  NUTRITION = "NUTRITION",
  MINDSET = "MINDSET",
  TRAINING = "TRAINING",
  RECOVERY = "RECOVERY",
}

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  [BlogCategory.UNCATEGORIZED]: "Uncategorized",
  [BlogCategory.FITNESS]: "Fitness",
  [BlogCategory.NUTRITION]: "Nutrition",
  [BlogCategory.MINDSET]: "Mindset",
  [BlogCategory.TRAINING]: "Training",
  [BlogCategory.RECOVERY]: "Recovery",
};

export enum BlogToggleField {
  IS_PUBLISHED = "isPublished",
  IS_FEATURED = "isFeatured",
}
