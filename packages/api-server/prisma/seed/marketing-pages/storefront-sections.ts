import { type SectionSeed } from "./types";

export const STOREFRONT_SECTIONS: readonly SectionSeed[] = [
  {
    pageSlug: "storefront",
    section: "storefront:hero",
    data: {
      title: "Programming Tracks",
      subtitle: "Structured paths for every level of CrossFit athlete.",
      buttonText: "Browse Programs",
      buttonHref: "#programs",
      backgroundImage:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2000&q=80",
    },
  },
  {
    pageSlug: "storefront",
    section: "storefront:grid",
    data: {
      title: "Find Your Track",
      subtitle: "Every program is built around a specific athlete profile. Pick the one that fits.",
      freeLabel: "Free",
      modalDismissLabel: "maybe later",
      modalActionLabel: "get started",
    },
  },
  {
    pageSlug: "storefront",
    section: "storefront:cta",
    data: {
      title: "Ready to Train With Purpose?",
      subtitle: "Join 100+ athletes across Ukraine training with The Discipline Program.",
      buttonText: "Start Your Journey",
      buttonHref: "/contact",
    },
  },
];
