import {
  isGroupFieldKinds,
  isListFieldKinds,
  SectionFieldKind,
  type ListFieldKinds,
  type SectionFieldKindTree,
} from "@repo/contracts/cms/pages";

import { isRecord } from "../section-field/field-at-path";

export type KeptWord = { path: string; value: string };

type JsonRecord = Readonly<Record<string, unknown>>;

const recordOf = (value: unknown): JsonRecord => (isRecord(value) ? value : {});
const rowsOf = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);
const wordOf = (value: unknown): string =>
  typeof value === "string" && value.trim() !== "" ? value : "";

const listWords = (
  node: ListFieldKinds,
  applied: unknown,
  current: unknown,
  next: unknown,
): KeptWord[] =>
  rowsOf(next).flatMap((row, targetIndex) => {
    if (!isRecord(row)) {
      return [];
    }

    const id = row[node.identity];

    if (typeof id !== "string" || id === "") {
      return [];
    }

    const appliedRow = rowsOf(applied).find((item) => isRecord(item) && item[node.identity] === id);
    const currentRow = rowsOf(current).find((item) => isRecord(item) && item[node.identity] === id);

    if (!isRecord(appliedRow) || !isRecord(currentRow)) {
      return [];
    }

    return keptWords(node.list, appliedRow, currentRow, row).map(({ path, value }) => ({
      path: `${targetIndex}.${path}`,
      value,
    }));
  });

export const keptWords = (
  tree: SectionFieldKindTree,
  applied: JsonRecord,
  current: JsonRecord,
  next: JsonRecord,
): KeptWord[] =>
  Object.entries(tree).flatMap(([field, node]) => {
    const nested = isGroupFieldKinds(node)
      ? keptWords(
          node.group,
          recordOf(applied[field]),
          recordOf(current[field]),
          recordOf(next[field]),
        )
      : isListFieldKinds(node)
        ? listWords(node, applied[field], current[field], next[field])
        : undefined;

    if (nested !== undefined) {
      return nested.map(({ path, value }) => ({ path: `${field}.${path}`, value }));
    }

    const value = wordOf(current[field]);

    return node === SectionFieldKind.WORD &&
      value !== "" &&
      value !== wordOf(applied[field]) &&
      value !== wordOf(next[field])
      ? [{ path: field, value }]
      : [];
  });
