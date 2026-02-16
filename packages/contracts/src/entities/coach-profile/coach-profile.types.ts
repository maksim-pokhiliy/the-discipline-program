import { type z } from "zod";

import { type coachProfileSchema } from "./coach-profile.schema";

export type CoachProfile = z.infer<typeof coachProfileSchema>;
