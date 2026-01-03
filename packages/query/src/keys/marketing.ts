import { type QueryKey } from "@tanstack/react-query";

export const marketingKeys = {
  root: ["marketing"] as const,

  pages: {
    home: (): QueryKey => [...marketingKeys.root, "pages", "home"] as const,
    programs: (): QueryKey => [...marketingKeys.root, "pages", "programs"] as const,
    about: (): QueryKey => [...marketingKeys.root, "pages", "about"] as const,
    blog: (): QueryKey => [...marketingKeys.root, "pages", "blog"] as const,
    contact: (): QueryKey => [...marketingKeys.root, "pages", "contact"] as const,
  },

  blog: {
    article: (slug: string): QueryKey => [...marketingKeys.root, "blog-articles", slug] as const,
  },

  programs: {
    all: (): QueryKey => [...marketingKeys.root, "programs"] as const,
  },

  reviews: {
    all: (): QueryKey => [...marketingKeys.root, "reviews"] as const,
  },

  payments: {
    all: (): QueryKey => ["marketing", "payments"],
    order: (orderId: string): QueryKey => ["marketing", "payments", "order", orderId],
  },
} as const;
