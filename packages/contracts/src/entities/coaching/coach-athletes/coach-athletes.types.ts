import { type z } from "zod";

import {
  type coachAthleteListItemSchema,
  type coachAthletePlanSchema,
  type coachAthletesSummarySchema,
} from "./coach-athletes.schema";

export type CoachAthletePlan = z.infer<typeof coachAthletePlanSchema>;
export type CoachAthleteListItem = z.infer<typeof coachAthleteListItemSchema>;
export type CoachAthletesSummary = z.infer<typeof coachAthletesSummarySchema>;
