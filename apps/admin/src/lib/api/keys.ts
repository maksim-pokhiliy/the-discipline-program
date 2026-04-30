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
  library: {
    blockKinds: createEntityKeys(ROOT, "library-block-kinds"),
    blockTemplates: createEntityKeys(ROOT, "library-block-templates"),
    exercises: createEntityKeys(ROOT, "library-exercises"),
    schemeTemplates: createEntityKeys(ROOT, "library-scheme-templates"),
    sessionTemplates: createEntityKeys(ROOT, "library-session-templates"),
    weekTemplates: createEntityKeys(ROOT, "library-week-templates"),
  },

  pages: {
    list: () => [...ROOT, "pages", "list"] as const,
    bySlug: (slug: string) => [...ROOT, "pages", slug] as const,
  },
} as const;
