import { type z } from "zod";

import {
  type athleteProfileSchema,
  type updateAthleteProfileSchema,
} from "./athlete-profile.schema";

export type AthleteProfile = z.infer<typeof athleteProfileSchema>;
export type UpdateAthleteProfileData = z.infer<typeof updateAthleteProfileSchema>;
