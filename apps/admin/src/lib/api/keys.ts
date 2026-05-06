import { createEntityKeys } from "@repo/query";

const ROOT = ["admin"] as const;

export const adminKeys = {
  root: ROOT,

  dashboard: () => [...ROOT, "dashboard"] as const,

  contacts: createEntityKeys(ROOT, "contacts"),

  blog: createEntityKeys(ROOT, "blog"),
  blockTypes: createEntityKeys(ROOT, "block-types"),
  dayTypes: createEntityKeys(ROOT, "day-types"),
  exercises: createEntityKeys(ROOT, "exercises"),
  products: createEntityKeys(ROOT, "products"),
  reviews: createEntityKeys(ROOT, "reviews"),
  schemeTypes: createEntityKeys(ROOT, "scheme-types"),
  users: {
    ...createEntityKeys(ROOT, "users"),
    coaches: () => [...ROOT, "users-coaches"] as const,
  },

  pages: {
    list: () => [...ROOT, "pages", "list"] as const,
    bySlug: (slug: string) => [...ROOT, "pages", slug] as const,
  },
} as const;
