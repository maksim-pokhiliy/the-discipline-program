import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

export const deleteRefusalOf = (
  error: Error | null,
  language: Pick<AdminLocaleListItem, "name" | "isEnabled">,
): string | null => {
  const details = error instanceof ConflictError ? error.details : undefined;
  const sectionCount = details?.translatedSectionCount;
  const productCount = details?.translatedProductCount;
  const parts: string[] = [];

  if (typeof sectionCount === "number" && sectionCount > 0) {
    parts.push(`${sectionCount} ${sectionCount === 1 ? "section" : "sections"}`);
  }

  if (typeof productCount === "number" && productCount > 0) {
    parts.push(`${productCount} ${productCount === 1 ? "product" : "products"}`);
  }

  if (parts.length === 0) {
    return null;
  }

  const advice = language.isEnabled
    ? "Disable it instead to hide it from the site."
    : "It stays hidden from the site while it is disabled.";

  return `${language.name} still has content in ${parts.join(" and ")}, so it cannot be deleted. ${advice}`;
};
