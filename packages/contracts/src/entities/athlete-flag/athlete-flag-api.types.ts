import { type z } from "zod";

import {
  type createAthleteFlagRequestSchema,
  type createAthleteFlagResponseSchema,
  type deleteAthleteFlagParamsSchema,
  type getAthleteFlagByIdParamsSchema,
  type getAthleteFlagsResponseSchema,
  type resolveAthleteFlagParamsSchema,
  type resolveAthleteFlagResponseSchema,
  type updateAthleteFlagParamsSchema,
  type updateAthleteFlagRequestSchema,
  type updateAthleteFlagResponseSchema,
} from "./athlete-flag-api.schema";

export type GetAthleteFlagsResponse = z.infer<typeof getAthleteFlagsResponseSchema>;
export type GetAthleteFlagByIdParams = z.infer<typeof getAthleteFlagByIdParamsSchema>;
export type CreateAthleteFlagRequest = z.infer<typeof createAthleteFlagRequestSchema>;
export type CreateAthleteFlagResponse = z.infer<typeof createAthleteFlagResponseSchema>;
export type UpdateAthleteFlagParams = z.infer<typeof updateAthleteFlagParamsSchema>;
export type UpdateAthleteFlagRequest = z.infer<typeof updateAthleteFlagRequestSchema>;
export type UpdateAthleteFlagResponse = z.infer<typeof updateAthleteFlagResponseSchema>;
export type DeleteAthleteFlagParams = z.infer<typeof deleteAthleteFlagParamsSchema>;
export type ResolveAthleteFlagParams = z.infer<typeof resolveAthleteFlagParamsSchema>;
export type ResolveAthleteFlagResponse = z.infer<typeof resolveAthleteFlagResponseSchema>;
