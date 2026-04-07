import { type z } from "zod";

import {
  type athleteActionItemSchema,
  type coachAthleteDetailSchema,
  type coachAthletesDataSchema,
  type consistencySchema,
  type nextWorkoutSchema,
  type planDisciplineSchema,
  type recentWorkoutSchema,
} from "./coach-athletes-api.schema";

export type CoachAthletesData = z.infer<typeof coachAthletesDataSchema>;
export type PlanDiscipline = z.infer<typeof planDisciplineSchema>;
export type RecentWorkout = z.infer<typeof recentWorkoutSchema>;
export type AthleteActionItem = z.infer<typeof athleteActionItemSchema>;
export type NextWorkout = z.infer<typeof nextWorkoutSchema>;
export type AthleteConsistency = z.infer<typeof consistencySchema>;
export type CoachAthleteDetail = z.infer<typeof coachAthleteDetailSchema>;
