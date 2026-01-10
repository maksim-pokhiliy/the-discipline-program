import { type z } from "zod";

import {
  type getProgramStatsResponseSchema,
  type getProgramsPageDataResponseSchema,
} from "./program-api.schema";
import {
  type programSchema,
  type createProgramSchema,
  type updateProgramSchema,
} from "./program.schema";

export type Program = z.infer<typeof programSchema>;

export type CreateProgramData = z.infer<typeof createProgramSchema>;

export type UpdateProgramData = z.infer<typeof updateProgramSchema>;

export type ProgramStats = z.infer<typeof getProgramStatsResponseSchema>;

export type AdminProgramsPageData = z.infer<typeof getProgramsPageDataResponseSchema>;
