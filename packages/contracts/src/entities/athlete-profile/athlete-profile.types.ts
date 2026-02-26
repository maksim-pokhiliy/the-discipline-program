import { type z } from "zod";

import {
  type athleteProfileSchema,
  type healthStatusSchema,
  type updateAthleteProfileSchema,
} from "./athlete-profile.schema";

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type AthleteProfile = z.infer<typeof athleteProfileSchema>;
export type UpdateAthleteProfileData = z.infer<typeof updateAthleteProfileSchema>;
