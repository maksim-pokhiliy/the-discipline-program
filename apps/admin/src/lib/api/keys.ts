import { type GetExercisesQuery } from "@repo/contracts/library/exercise";
import { createEntityKeys } from "@repo/query";

const ROOT = ["admin"] as const;

export const adminKeys = {
  root: ROOT,

  dashboard: () => [...ROOT, "dashboard"] as const,

  contacts: createEntityKeys(ROOT, "contacts"),

  blog: createEntityKeys(ROOT, "blog"),
  products: createEntityKeys(ROOT, "products"),
  reviews: createEntityKeys(ROOT, "reviews"),
  users: {
    ...createEntityKeys(ROOT, "users"),
    coaches: () => [...ROOT, "users-coaches"] as const,
  },

  libraryExercises: {
    ...createEntityKeys(ROOT, "library-exercises"),
    all: () => [...ROOT, "library-exercises"] as const,
    list: (query: GetExercisesQuery = {}) => [...ROOT, "library-exercises", "list", query] as const,
    reviewQueue: () => [...ROOT, "library-exercises", "review-queue"] as const,
    search: (query: string) => [...ROOT, "library-exercises", "search", query] as const,
  },

  librarySchemes: createEntityKeys(ROOT, "library-schemes"),

  libraryBlockTypes: createEntityKeys(ROOT, "library-block-types"),

  pages: {
    list: () => [...ROOT, "pages", "list"] as const,
    bySlug: (slug: string) => [...ROOT, "pages", slug] as const,
  },
} as const;
