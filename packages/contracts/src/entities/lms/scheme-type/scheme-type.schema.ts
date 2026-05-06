import { z } from "zod";

import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";
import { type SchemeArchetypeKind, type SchemeParams } from "../_domain/scheme-archetype.types";

import { SCHEME_TYPE_CONSTANTS } from "./scheme-type.constants";

const KIND_MISMATCH_ISSUE: { message: string; path: (string | number)[] } = {
  message: "defaultParams.kind must match archetypeKind",
  path: ["defaultParams"],
};

type RefinableSchemeShape = {
  archetypeKind?: SchemeArchetypeKind | undefined;
  defaultParams?: SchemeParams | null | undefined;
};

const refineKindMatches = (value: RefinableSchemeShape): boolean => {
  if (value.archetypeKind === undefined) {
    return true;
  }

  if (value.defaultParams === null || value.defaultParams === undefined) {
    return true;
  }

  return value.defaultParams.kind === value.archetypeKind;
};

const schemeTypeBaseSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(SCHEME_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createSchemeTypeBaseSchema = z.object({
  name: z.string().min(1).max(SCHEME_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  archetypeKind: schemeArchetypeKindSchema,
  defaultParams: schemeParamsSchema.optional(),
});

export const schemeTypeSchema = schemeTypeBaseSchema.refine(refineKindMatches, KIND_MISMATCH_ISSUE);

export const createSchemeTypeSchema = createSchemeTypeBaseSchema.refine(
  refineKindMatches,
  KIND_MISMATCH_ISSUE,
);

export const updateSchemeTypeSchema = createSchemeTypeBaseSchema
  .partial()
  .refine(refineKindMatches, KIND_MISMATCH_ISSUE);
