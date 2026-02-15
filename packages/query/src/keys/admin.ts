export const adminKeys = {
  root: ["admin"] as const,

  dashboard: () => [...adminKeys.root, "dashboard"] as const,

  exerciseCategories: {
    all: () => [...adminKeys.root, "exercise-categories"] as const,
  },

  exercises: {
    page: () => [...adminKeys.root, "exercises", "page-data"] as const,
    byId: (id: string) => [...adminKeys.root, "exercises", id] as const,
  },

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

  upload: {
    root: () => [...adminKeys.root, "upload"] as const,
  },

  pages: {
    all: ["admin", "pages"] as const,
    list: () => [...adminKeys.pages.all, "list"] as const,
    bySlug: (slug: string) => [...adminKeys.pages.all, slug] as const,
  },
} as const;
