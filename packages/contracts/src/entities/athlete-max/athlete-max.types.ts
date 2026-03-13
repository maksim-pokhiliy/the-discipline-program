import { type z } from "zod";

import {
  type athleteMaxSchema,
  type createAthleteMaxSchema,
  type updateAthleteMaxSchema,
} from "./athlete-max.schema";

export type AthleteMax = z.infer<typeof athleteMaxSchema>;
export type CreateAthleteMaxData = z.infer<typeof createAthleteMaxSchema>;
export type UpdateAthleteMaxData = z.infer<typeof updateAthleteMaxSchema>;
