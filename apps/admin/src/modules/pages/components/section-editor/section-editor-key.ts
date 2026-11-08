import { type LocaleCode } from "@repo/contracts/cms/locale";
import { type AdminPageSection } from "@repo/contracts/cms/pages";

const getPropertyPaths = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([name, child]) => {
    if (child === "") {
      return [];
    }

    const path = prefix ? `${prefix}.${name}` : name;

    return [path, ...getPropertyPaths(child, path)];
  });
};

export const getSectionEditorKey = (
  section: Pick<AdminPageSection, "id" | "data">,
  locale: LocaleCode,
): string => `${locale}:${section.id}:${getPropertyPaths(section.data).sort().join(",")}`;
