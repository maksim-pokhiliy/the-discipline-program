import { type z } from "zod";

import {
  type createTrainingPlanSchema,
  type trainingPlanListItemSchema,
  type trainingPlanSchema,
  type trainingPlanStatusSchema,
  type updateTrainingPlanSchema,
} from "./training-plan.schema";

export type TrainingPlanStatus = z.infer<typeof trainingPlanStatusSchema>;
export type TrainingPlan = z.infer<typeof trainingPlanSchema>;
export type TrainingPlanListItem = z.infer<typeof trainingPlanListItemSchema>;
export type CreateTrainingPlanData = z.infer<typeof createTrainingPlanSchema>;
export type UpdateTrainingPlanData = z.infer<typeof updateTrainingPlanSchema>;
