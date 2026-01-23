export const ACTIVITY_TYPE = {
  REVIEW: "REVIEW",
  CONTACT: "CONTACT",
  USER: "USER",
  PROGRAM: "PROGRAM",
  BLOG_POST: "BLOG_POST",
} as const;

export const ACTIVITY_TYPES_LIST = Object.values(ACTIVITY_TYPE) as [string, ...string[]];

export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];
