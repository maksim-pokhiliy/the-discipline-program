import { type LocaleCode } from "@repo/contracts/cms/locale";
import { type AdminPageSection } from "@repo/contracts/cms/pages";

export const getSectionEditorKey = (
  section: Pick<AdminPageSection, "id" | "data">,
  locale: LocaleCode,
): string => `${locale}:${section.id}:${Object.keys(section.data).sort().join(",")}`;
