import { createEntityKeys } from "@repo/query";

const ROOT = ["admin"] as const;

export const adminKeys = {
  root: ROOT,

  dashboard: () => [...ROOT, "dashboard"] as const,

  contacts: createEntityKeys(ROOT, "contacts"),

  blog: createEntityKeys(ROOT, "blog"),
  equipment: createEntityKeys(ROOT, "equipment"),
  exercises: {
    ...createEntityKeys(ROOT, "exercises"),
    movementFamilies: () => [...ROOT, "exercises-movement-families"] as const,
  },
  labels: createEntityKeys(ROOT, "labels"),
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
