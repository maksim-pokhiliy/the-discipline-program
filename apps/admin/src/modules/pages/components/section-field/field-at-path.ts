import {
  isGroupFieldKinds,
  isListFieldKinds,
  type SectionFieldKind,
  type SectionFieldKindTree,
} from "@repo/contracts/cms/pages";

const isListIndex = (segment: string): boolean => /^\d+$/.test(segment);

export const fieldKindAt = (
  tree: SectionFieldKindTree,
  path: string,
): SectionFieldKind | undefined => {
  const [field, ...rest] = path.split(".");
  const node = field === undefined ? undefined : tree[field];

  if (node === undefined) {
    return undefined;
  }

  if (typeof node === "string") {
    return rest.length === 0 ? node : undefined;
  }

  if (isGroupFieldKinds(node)) {
    return fieldKindAt(node.group, rest.join("."));
  }

  const [index, ...rowPath] = rest;

  return isListFieldKinds(node) && index !== undefined && isListIndex(index)
    ? fieldKindAt(node.list, rowPath.join("."))
    : undefined;
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const textAt = (record: Readonly<Record<string, unknown>>, path: string): string => {
  let value: unknown = record;

  for (const segment of path.split(".")) {
    if (Array.isArray(value) && isListIndex(segment)) {
      const rows: readonly unknown[] = value;

      value = rows[Number(segment)];
    } else if (isRecord(value)) {
      value = value[segment];
    } else {
      return "";
    }
  }

  return typeof value === "string" ? value : "";
};
