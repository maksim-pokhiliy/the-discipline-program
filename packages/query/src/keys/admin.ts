export const adminKeys = {
  root: ["admin"] as const,

  dashboard: () => [...adminKeys.root, "dashboard"] as const,

  contacts: {
    all: () => [...adminKeys.root, "contacts"] as const,
  },

  blog: {
    page: () => [...adminKeys.root, "blog", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "blog", id] as const,
  },

  storefront: {
    page: () => [...adminKeys.root, "storefront", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "storefront", id] as const,
  },

  reviews: {
    page: () => [...adminKeys.root, "reviews", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "reviews", id] as const,
  },

  upload: {
    root: () => [...adminKeys.root, "upload"] as const,
  },

  pages: {
    list: () => [...adminKeys.root, "pages", "list"] as const,
    bySlug: (slug: string) => [...adminKeys.root, "pages", slug] as const,
  },
} as const;
