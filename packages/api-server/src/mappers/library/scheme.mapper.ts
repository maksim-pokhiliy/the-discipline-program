import { type Scheme as PrismaScheme } from "@prisma/client";

import {
  type Scheme,
  type SchemeParamKey,
  schemeParamKeySchema,
} from "@repo/contracts/library/scheme";

import { SCHEME_KIND_MAP } from "./enum-maps";

const toRequiredParams = (values: string[]): SchemeParamKey[] =>
  values.filter((value): value is SchemeParamKey => schemeParamKeySchema.safeParse(value).success);

const toParamDefaults = (value: PrismaScheme["paramDefaults"]): Record<SchemeParamKey, number> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<SchemeParamKey, number>;
  }

  const result: Partial<Record<SchemeParamKey, number>> = {};

  for (const [key, raw] of Object.entries(value)) {
    const parsedKey = schemeParamKeySchema.safeParse(key);

    if (!parsedKey.success) {
      continue;
    }

    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
      result[parsedKey.data] = raw;
    }
  }

  return result as Record<SchemeParamKey, number>;
};

export const mapToScheme = (row: PrismaScheme): Scheme => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  kind: SCHEME_KIND_MAP[row.kind],
  description: row.description,
  requiredParams: toRequiredParams(row.requiredParams),
  paramDefaults: toParamDefaults(row.paramDefaults),
  active: row.active,
  sortOrder: row.sortOrder,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
