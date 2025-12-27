export const DOMANCHORS = {
  BODY: "app-body",
  HEADER: "app-header",
  FOOTER: "app-footer",
  HERO: "hero",
  PROGRAMS: "programs",
  REVIEWS: "reviews",
  CONTACT: "contact",
} as const;

export type DomAnchorId = (typeof DOMANCHORS)[keyof typeof DOMANCHORS];
