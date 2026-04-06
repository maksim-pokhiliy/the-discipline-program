import { type z } from "zod";

import {
  type coachAthletePlanSchema,
  type coachAthleteListItemSchema,
  type coachAthletesSummarySchema,
  type coachAthletesDataSchema,
} from "./coach-athletes.schema";

export type CoachAthletePlan = z.infer<typeof coachAthletePlanSchema>;
export type CoachAthleteListItem = z.infer<typeof coachAthleteListItemSchema>;
export type CoachAthletesSummary = z.infer<typeof coachAthletesSummarySchema>;
export type CoachAthletesData = z.infer<typeof coachAthletesDataSchema>;
