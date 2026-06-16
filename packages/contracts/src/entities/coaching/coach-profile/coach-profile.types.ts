import { type z } from "zod";

import {
  type coachProfilePageDataSchema,
  type coachProfileSchema,
  type coachProfileUserSchema,
  type selfUpdateCoachProfileSchema,
  type trackRecordSchema,
} from "./coach-profile.schema";

export type CoachProfile = z.infer<typeof coachProfileSchema>;
export type CoachProfileUser = z.infer<typeof coachProfileUserSchema>;
export type TrackRecord = z.infer<typeof trackRecordSchema>;
export type CoachProfilePageData = z.infer<typeof coachProfilePageDataSchema>;
export type SelfUpdateCoachProfileData = z.infer<typeof selfUpdateCoachProfileSchema>;
export type UpdateCoachProfileData = z.infer<typeof selfUpdateCoachProfileSchema>;
