import { type z } from "zod";

import { type athleteProfileSchema } from "./athlete-profile.schema";

export type AthleteProfile = z.infer<typeof athleteProfileSchema>;
