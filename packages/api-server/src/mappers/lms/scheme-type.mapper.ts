import { type SchemeType as PrismaSchemeType } from "@prisma/client";

import { schemeParamsSchema, type SchemeParams } from "@repo/contracts/lms/_domain";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";
import { logger } from "@repo/shared";

import { SCHEME_ARCHETYPE_KIND_MAP } from "./enum-maps-status";

const parseDefaultParams = (s: PrismaSchemeType): SchemeParams | null => {
  if (s.defaultParams === null) {
    return null;
  }

  const result = schemeParamsSchema.safeParse(s.defaultParams);

  if (!result.success) {
    logger.warn("scheme_type.default_params.parse_failed", {
      schemeTypeId: s.id,
      error: result.error.message,
    });

    return null;
  }

  return result.data;
};

export const mapToSchemeType = (s: PrismaSchemeType): SchemeType => ({
  id: s.id,
  name: s.name,
  archetypeKind: SCHEME_ARCHETYPE_KIND_MAP[s.archetypeKind],
  defaultParams: parseDefaultParams(s),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
