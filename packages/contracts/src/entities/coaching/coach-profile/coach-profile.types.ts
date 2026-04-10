import { type z } from "zod";

import { type coachProfileSchema, type updateCoachProfileSchema } from "./coach-profile.schema";

export type CoachProfile = z.infer<typeof coachProfileSchema>;
export type UpdateCoachProfileData = z.infer<typeof updateCoachProfileSchema>;
