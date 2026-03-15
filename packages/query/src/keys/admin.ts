export const adminKeys = {
  root: ["admin"] as const,

  dashboard: () => [...adminKeys.root, "dashboard"] as const,

  contacts: {
    all: () => [...adminKeys.root, "contacts"] as const,
    page: () => [...adminKeys.root, "contacts", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "contacts", id] as const,
  },

  blog: {
    page: () => [...adminKeys.root, "blog", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "blog", id] as const,
  },

  products: {
    page: () => [...adminKeys.root, "products", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "products", id] as const,
  },

  reviews: {
    page: () => [...adminKeys.root, "reviews", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "reviews", id] as const,
  },

  users: {
    page: () => [...adminKeys.root, "users", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "users", id] as const,
  },

  upload: {
    root: () => [...adminKeys.root, "upload"] as const,
  },

  pages: {
    all: () => [...adminKeys.root, "pages"] as const,
    list: () => [...adminKeys.pages.all(), "list"] as const,
    bySlug: (slug: string) => [...adminKeys.pages.all(), slug] as const,
  },
} as const;
