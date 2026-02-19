import { type z } from "zod";

import {
  type getCoachProfileResponseSchema,
  type updateCoachProfileRequestSchema,
  type updateCoachProfileResponseSchema,
} from "./coach-profile-api.schema";

export type GetCoachProfileResponse = z.infer<typeof getCoachProfileResponseSchema>;
export type UpdateCoachProfileRequest = z.infer<typeof updateCoachProfileRequestSchema>;
export type UpdateCoachProfileResponse = z.infer<typeof updateCoachProfileResponseSchema>;
