import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

export const deleteRefusalOf = (
  error: Error | null,
  language: Pick<AdminLocaleListItem, "name" | "isEnabled">,
): string | null => {
  const count = error instanceof ConflictError ? error.details?.translatedSectionCount : undefined;

  if (typeof count !== "number") {
    return null;
  }

  const advice = language.isEnabled
    ? "Disable it instead to hide it from the site."
    : "It stays hidden from the site while it is disabled.";

  return `${language.name} still has content in ${count} ${count === 1 ? "section" : "sections"}, so it cannot be deleted. ${advice}`;
};
