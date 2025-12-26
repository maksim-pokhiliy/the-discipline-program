export const marketingKeys = {
  root: ["marketing"] as const,

  pages: {
    home: () => [...marketingKeys.root, "pages", "home"] as const,
    programs: () => [...marketingKeys.root, "pages", "programs"] as const,
    about: () => [...marketingKeys.root, "pages", "about"] as const,
    blog: () => [...marketingKeys.root, "pages", "blog"] as const,
    contact: () => [...marketingKeys.root, "pages", "contact"] as const,
  },

  blog: {
    article: (slug: string) => [...marketingKeys.root, "blog-articles", slug] as const,
  },

  programs: {
    all: () => [...marketingKeys.root, "programs"] as const,
  },

  reviews: {
    all: () => [...marketingKeys.root, "reviews"] as const,
  },
} as const;
