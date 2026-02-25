import { type z } from "zod";

import {
  type athleteFlagSchema,
  type createAthleteFlagSchema,
  type flagTypeSchema,
  type updateAthleteFlagSchema,
} from "./athlete-flag.schema";

export type FlagType = z.infer<typeof flagTypeSchema>;
export type AthleteFlag = z.infer<typeof athleteFlagSchema>;
export type CreateAthleteFlagData = z.infer<typeof createAthleteFlagSchema>;
export type UpdateAthleteFlagData = z.infer<typeof updateAthleteFlagSchema>;
