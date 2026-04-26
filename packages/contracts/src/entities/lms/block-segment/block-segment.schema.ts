import { z } from "zod";

import { restSpecSchema } from "../_domain/rest-spec.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_SEGMENT_CONSTANTS } from "./block-segment.constants";

export const blockSegmentSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(BLOCK_SEGMENT_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  archetypeKind: schemeArchetypeKindSchema,
  schemeParams: schemeParamsSchema,
  schemeTemplateId: z.string().cuid().nullable(),
  restConfig: restSpecSchema.nullable(),
});
