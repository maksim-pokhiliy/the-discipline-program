import { createEntityKeys } from "@repo/query";

const ROOT = ["admin"] as const;

export const adminKeys = {
  root: ROOT,

  dashboard: () => [...ROOT, "dashboard"] as const,

  contacts: createEntityKeys(ROOT, "contacts"),

  blog: createEntityKeys(ROOT, "blog"),
  exercises: createEntityKeys(ROOT, "exercises"),
  labels: createEntityKeys(ROOT, "labels"),
  profileAxes: createEntityKeys(ROOT, "profileAxes"),
  products: createEntityKeys(ROOT, "products"),
  reviews: createEntityKeys(ROOT, "reviews"),
  users: {
    ...createEntityKeys(ROOT, "users"),
    coaches: () => [...ROOT, "users-coaches"] as const,
  },

  pages: {
    list: () => [...ROOT, "pages", "list"] as const,
    bySlug: (slug: string) => [...ROOT, "pages", slug] as const,
  },
} as const;
