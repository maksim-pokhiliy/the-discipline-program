import { type z } from "zod";

import {
  type createPrescribedSetParamsSchema,
  type createPrescribedSetRequestSchema,
  type deletePrescribedSetParamsSchema,
  type getPrescribedSetByIdParamsSchema,
  type getPrescribedSetResponseSchema,
  type getPrescribedSetsParamsSchema,
  type getPrescribedSetsResponseSchema,
  type updatePrescribedSetParamsSchema,
  type updatePrescribedSetRequestSchema,
} from "./prescribed-set-api.schema";

export type GetPrescribedSetsParams = z.infer<typeof getPrescribedSetsParamsSchema>;
export type GetPrescribedSetsResponse = z.infer<typeof getPrescribedSetsResponseSchema>;
export type GetPrescribedSetByIdParams = z.infer<typeof getPrescribedSetByIdParamsSchema>;
export type GetPrescribedSetResponse = z.infer<typeof getPrescribedSetResponseSchema>;
export type CreatePrescribedSetParams = z.infer<typeof createPrescribedSetParamsSchema>;
export type CreatePrescribedSetRequest = z.infer<typeof createPrescribedSetRequestSchema>;
export type UpdatePrescribedSetParams = z.infer<typeof updatePrescribedSetParamsSchema>;
export type UpdatePrescribedSetRequest = z.infer<typeof updatePrescribedSetRequestSchema>;
export type DeletePrescribedSetParams = z.infer<typeof deletePrescribedSetParamsSchema>;
