import { z } from "zod";

import {
  createPrescribedSetSchema,
  prescribedSetSchema,
  updatePrescribedSetSchema,
} from "./prescribed-set.schema";

export const getPrescribedSetsParamsSchema = z.object({
  blockId: z.string().cuid(),
});

export const getPrescribedSetsResponseSchema = z.array(prescribedSetSchema);

export const getPrescribedSetByIdParamsSchema = z.object({
  blockId: z.string().cuid(),
  id: z.string().cuid(),
});

export const getPrescribedSetResponseSchema = prescribedSetSchema;

export const createPrescribedSetParamsSchema = z.object({
  blockId: z.string().cuid(),
});

export const createPrescribedSetRequestSchema = createPrescribedSetSchema;

export const updatePrescribedSetParamsSchema = z.object({
  blockId: z.string().cuid(),
  id: z.string().cuid(),
});

export const updatePrescribedSetRequestSchema = updatePrescribedSetSchema;

export const deletePrescribedSetParamsSchema = z.object({
  blockId: z.string().cuid(),
  id: z.string().cuid(),
});
