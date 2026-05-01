import { type SectionSeed } from "./types";

export const BLOG_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "blog",
    section: "blog:hero",
    data: {
      title: "The Whiteboard",
      subtitle: "WOD strategy, lifting technique, nutrition, and mindset.",
      backgroundImage:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=80",
    },
  },
  {
    pageSlug: "blog",
    section: "blog:grid",
    data: {
      title: "All Articles",
      subtitle: "Training insights, recovery tips, and competition strategy.",
      readMoreLabel: "read more",
      minReadSuffix: "min read",
      readArticleLabel: "read article",
      notPublishedLabel: "Not published",
    },
  },
  {
    pageSlug: "blog",
    section: "blog:related",
    data: {
      title: "Related Articles",
    },
  },
];
