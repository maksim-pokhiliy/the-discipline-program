import { PageSlug } from "@repo/contracts/cms/pages";

export const PAGE_LABELS: Record<PageSlug, string> = {
  [PageSlug.HOME]: "Home",
  [PageSlug.STOREFRONT]: "Storefront",
  [PageSlug.ABOUT]: "About",
  [PageSlug.BLOG]: "Blog",
  [PageSlug.CONTACT]: "Contact",
  [PageSlug.FAQ]: "FAQ",
  [PageSlug.OFFER]: "Public Offer",
  [PageSlug.SITE]: "Site (shared strings)",
};
