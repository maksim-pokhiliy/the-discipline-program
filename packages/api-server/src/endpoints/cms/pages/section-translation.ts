import { type Prisma } from "@prisma/client";

import {
  isGroupFieldKinds,
  isListFieldKinds,
  type ListFieldKinds,
  SECTION_FIELD_KINDS,
  SectionFieldKind,
  type SectionFieldKindNode,
  type SectionFieldKindTree,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";

import { EMPTY_SECTION_DATA } from "./page-sections";

type JsonRecord = Readonly<Record<string, unknown>>;

export type ComposedSection = { data: Prisma.InputJsonObject; isActive: boolean };

const EMPTY_ROW: JsonRecord = {};

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): JsonRecord => (isRecord(value) ? value : EMPTY_ROW);

const asRows = (value: unknown): readonly JsonRecord[] => {
  const rows: readonly unknown[] = Array.isArray(value) ? value : [];

  return rows.map(asRecord);
};

export const isWordWritten = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const rowIdentity = (list: ListFieldKinds, row: JsonRecord, index: number): string => {
  const id = list.identity === undefined ? undefined : row[list.identity];

  return typeof id === "string" && id !== "" ? `id:${id}` : `index:${index}`;
};

const matchRow = (
  list: ListFieldKinds,
  sourceRows: readonly JsonRecord[],
  englishRow: JsonRecord,
  englishIndex: number,
): JsonRecord => {
  const identity = rowIdentity(list, englishRow, englishIndex);

  return sourceRows.find((row, index) => rowIdentity(list, row, index) === identity) ?? EMPTY_ROW;
};

const overlayRows = (
  list: ListFieldKinds,
  englishRows: readonly JsonRecord[],
  sourceRows: readonly JsonRecord[],
): Prisma.InputJsonObject[] =>
  englishRows.map((englishRow, index) =>
    overlayWords(list.list, englishRow, matchRow(list, sourceRows, englishRow, index)),
  );

const overlayField = (
  node: SectionFieldKindNode,
  english: unknown,
  source: unknown,
): Prisma.InputJsonValue | undefined => {
  if (isListFieldKinds(node)) {
    return Array.isArray(english) ? overlayRows(node, asRows(english), asRows(source)) : undefined;
  }

  if (isGroupFieldKinds(node)) {
    const group = overlayWords(node.group, asRecord(english), asRecord(source));

    return Object.keys(group).length > 0 ? group : undefined;
  }

  if (node === SectionFieldKind.SHARED) {
    return typeof english === "string" ? english : undefined;
  }

  return isWordWritten(source) ? source : undefined;
};

export const overlayWords = (
  tree: SectionFieldKindTree,
  english: JsonRecord,
  source: JsonRecord,
): Prisma.InputJsonObject => {
  const result: Record<string, Prisma.InputJsonValue> = {};

  for (const [field, node] of Object.entries(tree)) {
    const value = overlayField(node, english[field], source[field]);

    if (value !== undefined) {
      result[field] = value;
    }
  }

  return result;
};

export const hasWrittenWord = (tree: SectionFieldKindTree, data: JsonRecord): boolean =>
  Object.entries(tree).some(([field, node]) => {
    if (isListFieldKinds(node)) {
      return asRows(data[field]).some((row) => hasWrittenWord(node.list, row));
    }

    if (isGroupFieldKinds(node)) {
      return hasWrittenWord(node.group, asRecord(data[field]));
    }

    return node === SectionFieldKind.WORD && isWordWritten(data[field]);
  });

export const isEveryWordWritten = (
  tree: SectionFieldKindTree,
  english: JsonRecord,
  data: JsonRecord,
): boolean =>
  Object.entries(tree).every(([field, node]) => {
    if (isListFieldKinds(node)) {
      const sourceRows = asRows(data[field]);

      return asRows(english[field]).every((row, index) =>
        isEveryWordWritten(node.list, row, matchRow(node, sourceRows, row, index)),
      );
    }

    if (isGroupFieldKinds(node)) {
      return isEveryWordWritten(node.group, asRecord(english[field]), asRecord(data[field]));
    }

    return (
      node !== SectionFieldKind.WORD || !isWordWritten(english[field]) || isWordWritten(data[field])
    );
  });

export const composeTranslatedSection = (
  section: SectionSchemaKey,
  english: JsonRecord,
  body: JsonRecord,
): ComposedSection => {
  const tree = SECTION_FIELD_KINDS[section];
  const overlaid = overlayWords(tree, english, body);
  const data = hasWrittenWord(tree, overlaid) ? overlaid : EMPTY_SECTION_DATA;

  return { data, isActive: isEveryWordWritten(tree, english, data) };
};
