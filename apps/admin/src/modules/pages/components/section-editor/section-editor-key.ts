import { type AdminPageSection } from "@repo/contracts/cms/pages";

export const getSectionEditorKey = (section: Pick<AdminPageSection, "id" | "data">): string =>
  `${section.id}:${Object.keys(section.data).length === 0}`;
