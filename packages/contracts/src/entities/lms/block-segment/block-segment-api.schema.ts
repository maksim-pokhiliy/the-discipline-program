import { z } from "zod";

import { restSpecSchema } from "../_domain/rest-spec.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_SEGMENT_CONSTANTS } from "./block-segment.constants";
import { blockSegmentSchema } from "./block-segment.schema";

export const createBlockSegmentInputSchema = z.object({
  blockId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(BLOCK_SEGMENT_CONSTANTS.MAX_LABEL_LENGTH).optional(),
  archetypeKind: schemeArchetypeKindSchema,
  schemeParams: schemeParamsSchema,
  schemeTemplateId: z.string().cuid().optional(),
  restConfig: restSpecSchema.optional(),
});

export const updateBlockSegmentInputSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
  label: z.string().max(BLOCK_SEGMENT_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  archetypeKind: schemeArchetypeKindSchema,
  schemeParams: schemeParamsSchema,
  schemeTemplateId: z.string().cuid().nullable(),
  restConfig: restSpecSchema.nullable(),
});

export const blockSegmentIdParamSchema = z.object({ segmentId: z.string().cuid() });

export const getBlockSegmentResponseSchema = blockSegmentSchema;
export const createBlockSegmentResponseSchema = blockSegmentSchema;
export const updateBlockSegmentResponseSchema = blockSegmentSchema;
