import { type z } from "zod";

import {
  type getProgramsResponseSchema,
  type getProgramByIdParamsSchema,
  type createProgramRequestSchema,
  type updateProgramParamsSchema,
  type updateProgramRequestSchema,
  type deleteProgramParamsSchema,
  type toggleProgramStatusParamsSchema,
  type getProgramStatsResponseSchema,
  type getProgramsPageDataResponseSchema,
} from "./program-api.schema";

export type GetProgramsResponse = z.infer<typeof getProgramsResponseSchema>;

export type GetProgramByIdParams = z.infer<typeof getProgramByIdParamsSchema>;

export type CreateProgramRequest = z.infer<typeof createProgramRequestSchema>;

export type UpdateProgramParams = z.infer<typeof updateProgramParamsSchema>;

export type UpdateProgramRequest = z.infer<typeof updateProgramRequestSchema>;

export type DeleteProgramParams = z.infer<typeof deleteProgramParamsSchema>;

export type ToggleProgramStatusParams = z.infer<typeof toggleProgramStatusParamsSchema>;

export type GetProgramStatsResponse = z.infer<typeof getProgramStatsResponseSchema>;

export type GetProgramsPageDataResponse = z.infer<typeof getProgramsPageDataResponseSchema>;
