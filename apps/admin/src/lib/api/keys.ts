import { type LocaleCode } from "@repo/contracts/cms/locale";
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

  locales: {
    list: () => [...ROOT, "locales", "list"] as const,
  },

  pages: {
    list: (locale: LocaleCode) => [...ROOT, "pages", "list", locale] as const,
    details: (slug: string) => [...ROOT, "pages", "detail", slug] as const,
    detail: (slug: string, locale: LocaleCode) =>
      [...ROOT, "pages", "detail", slug, locale] as const,
    sectionSave: (slug: string, locale: LocaleCode) =>
      [...ROOT, "pages", "save", slug, locale] as const,
  },
} as const;
