import {
  isGroupFieldKinds,
  isListFieldKinds,
  SECTION_SCHEMAS,
  type SectionFieldKindNode,
  type SectionFieldKindTree,
  type SectionSchemaKey,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import { isRecord } from "../section-field/field-at-path";

type JsonRecord = Readonly<Record<string, unknown>>;

const recordOf = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const seedField = (node: SectionFieldKindNode, value: unknown): unknown => {
  if (isGroupFieldKinds(node)) {
    return buildTranslationSeed(node.group, recordOf(value));
  }

  if (isListFieldKinds(node)) {
    const rows: readonly unknown[] = Array.isArray(value) ? value : [];

    return rows.map((row) => buildTranslationSeed(node.list, recordOf(row)));
  }

  return typeof value === "string" ? value : "";
};

export const buildTranslationSeed = (
  tree: SectionFieldKindTree,
  data: JsonRecord,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(tree).map(([field, node]) => [field, seedField(node, data[field])]),
  );

export const isSectionWriteData = <TKey extends SectionSchemaKey>(
  section: TKey,
  value: unknown,
): value is SectionWriteData[TKey] =>
  SECTION_SCHEMAS[section].deepPartial().safeParse(value).success;

export const parseSectionWriteData = <TKey extends SectionSchemaKey>(
  section: TKey,
  value: unknown,
): SectionWriteData[TKey] => {
  const parsed: unknown = SECTION_SCHEMAS[section].deepPartial().parse(value);

  if (!isSectionWriteData(section, parsed)) {
    throw new Error("Parsed section form values do not match their section");
  }

  return parsed;
};
