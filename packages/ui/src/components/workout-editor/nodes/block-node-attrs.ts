import type { Attribute } from "@tiptap/core";

import type { SchemeKind } from "@repo/contracts/library/scheme";

import { BLOCK_NODE_GROUP } from "../constants";

type BlockAttributeShape = {
  blockTypeId: Attribute;
  schemeId: Attribute;
  schemeKind: Attribute;
  schemeConfig: Attribute;
  effortPct: Attribute;
  pace: Attribute;
  note: Attribute;
  sortOrder: Attribute;
};

const stringNull: Attribute = { default: null };
const numberNull: Attribute = { default: null };
const emptyObject: Attribute = { default: {} as Record<string, number> };
const zero: Attribute = { default: 0 };
const nullableString: Attribute = { default: null };
const nullableEnum: Attribute = { default: null };

export const buildFullBlockAttributes = (): BlockAttributeShape => ({
  blockTypeId: stringNull,
  schemeId: stringNull,
  schemeKind: nullableEnum,
  schemeConfig: emptyObject,
  effortPct: numberNull,
  pace: nullableString,
  note: nullableString,
  sortOrder: zero,
});

export const buildSchemelessBlockAttributes = () => ({
  blockTypeId: stringNull,
  note: nullableString,
  sortOrder: zero,
});

export const BLOCK_GROUP_VALUE = BLOCK_NODE_GROUP;

export type BlockAttrsValue = {
  blockTypeId: string | null;
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: Record<string, number>;
  effortPct: number | null;
  pace: string | null;
  note: string | null;
  sortOrder: number;
};

export type SchemelessBlockAttrsValue = {
  blockTypeId: string | null;
  note: string | null;
  sortOrder: number;
};
