import { type z } from "zod";

import {
  type getAthleteProfileResponseSchema,
  type updateAthleteProfileRequestSchema,
  type updateAthleteProfileResponseSchema,
} from "./athlete-profile-api.schema";

export type GetAthleteProfileResponse = z.infer<typeof getAthleteProfileResponseSchema>;
export type UpdateAthleteProfileRequest = z.infer<typeof updateAthleteProfileRequestSchema>;
export type UpdateAthleteProfileResponse = z.infer<typeof updateAthleteProfileResponseSchema>;
