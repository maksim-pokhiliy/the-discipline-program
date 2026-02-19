import { type z } from "zod";

import {
  type createTrainingPlanSchema,
  type trainingPlanSchema,
  type updateTrainingPlanSchema,
} from "./training-plan.schema";

export type TrainingPlan = z.infer<typeof trainingPlanSchema>;
export type CreateTrainingPlanData = z.infer<typeof createTrainingPlanSchema>;
export type UpdateTrainingPlanData = z.infer<typeof updateTrainingPlanSchema>;
