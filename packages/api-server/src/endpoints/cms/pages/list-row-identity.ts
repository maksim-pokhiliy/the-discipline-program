import { randomUUID } from "node:crypto";

import { type Prisma } from "@prisma/client";

import {
  isGroupFieldKinds,
  isListFieldKinds,
  type ListFieldKinds,
  SECTION_FIELD_KINDS,
  type SectionFieldKindTree,
  type SectionSchemaKey,
} from "@repo/contracts/cms/pages";
import { BadRequestError } from "@repo/errors";

type JsonRecord = Readonly<Record<string, unknown>>;
type JsonValue = Prisma.InputJsonValue | null | undefined;

const isJsonObject = (value: JsonValue): value is Prisma.InputJsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isJsonArray = (value: JsonValue): value is Prisma.InputJsonArray => Array.isArray(value);

export const rowIdOf = (list: ListFieldKinds, row: JsonRecord): string | undefined => {
  const id = row[list.identity];

  return typeof id === "string" && id !== "" ? id : undefined;
};

const withListRowIds = (
  section: SectionSchemaKey,
  field: string,
  list: ListFieldKinds,
  rows: Prisma.InputJsonArray,
): Prisma.InputJsonArray => {
  const ids = new Set<string>();

  for (const row of rows) {
    const id = isJsonObject(row) ? rowIdOf(list, row) : undefined;

    if (id === undefined) {
      continue;
    }

    if (ids.has(id)) {
      throw new BadRequestError(`Two rows of the list share the id ${id}`, {
        section,
        list: field,
        id,
      });
    }

    ids.add(id);
  }

  return rows.map((row) =>
    isJsonObject(row) && rowIdOf(list, row) === undefined
      ? { ...row, [list.identity]: randomUUID() }
      : row,
  );
};

const withRowIds = (
  section: SectionSchemaKey,
  tree: SectionFieldKindTree,
  data: Prisma.InputJsonObject,
): Prisma.InputJsonObject => {
  const result: Record<string, JsonValue> = { ...data };

  for (const [field, node] of Object.entries(tree)) {
    const value = data[field];

    if (isListFieldKinds(node) && isJsonArray(value)) {
      result[field] = withListRowIds(section, field, node, value);
    } else if (isGroupFieldKinds(node) && isJsonObject(value)) {
      result[field] = withRowIds(section, node.group, value);
    }
  }

  return result;
};

export const withEnglishRowIds = (
  section: SectionSchemaKey,
  data: Prisma.InputJsonObject,
): Prisma.InputJsonObject => withRowIds(section, SECTION_FIELD_KINDS[section], data);
