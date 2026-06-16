import { type z } from "zod";

import {
  type coachAthleteEnrollmentSchema,
  type coachAthleteListItemSchema,
  type coachAthletesSummarySchema,
} from "./coach-athletes.schema";

export type CoachAthleteEnrollment = z.infer<typeof coachAthleteEnrollmentSchema>;
export type CoachAthleteListItem = z.infer<typeof coachAthleteListItemSchema>;
export type CoachAthletesSummary = z.infer<typeof coachAthletesSummarySchema>;
