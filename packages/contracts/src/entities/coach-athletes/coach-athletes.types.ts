import { type z } from "zod";

import {
  type athleteActionItemSchema,
  type coachAthleteDetailSchema,
  type coachAthleteListItemSchema,
  type coachAthletePlanSchema,
  type coachAthletesDataSchema,
  type coachAthletesSummarySchema,
  type consistencySchema,
  type nextWorkoutSchema,
  type planDisciplineSchema,
  type recentWorkoutSchema,
} from "./coach-athletes.schema";

export type CoachAthletePlan = z.infer<typeof coachAthletePlanSchema>;
export type CoachAthleteListItem = z.infer<typeof coachAthleteListItemSchema>;
export type CoachAthletesSummary = z.infer<typeof coachAthletesSummarySchema>;
export type CoachAthletesData = z.infer<typeof coachAthletesDataSchema>;
export type PlanDiscipline = z.infer<typeof planDisciplineSchema>;
export type RecentWorkout = z.infer<typeof recentWorkoutSchema>;
export type AthleteActionItem = z.infer<typeof athleteActionItemSchema>;
export type NextWorkout = z.infer<typeof nextWorkoutSchema>;
export type AthleteConsistency = z.infer<typeof consistencySchema>;
export type CoachAthleteDetail = z.infer<typeof coachAthleteDetailSchema>;
