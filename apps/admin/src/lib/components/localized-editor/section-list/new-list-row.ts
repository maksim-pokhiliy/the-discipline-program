import { type ListRowValues, type SectionList } from "./section-list.types";

export const makeListRow = (fields: SectionList["fields"]): ListRowValues => ({
  id: crypto.randomUUID(),
  ...Object.fromEntries(Object.keys(fields).map((name) => [name, ""])),
});
