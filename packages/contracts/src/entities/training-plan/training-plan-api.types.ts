import { type z } from "zod";

import {
  type createTrainingPlanRequestSchema,
  type deleteTrainingPlanParamsSchema,
  type getTrainingPlanByIdParamsSchema,
  type getTrainingPlanResponseSchema,
  type getTrainingPlansResponseSchema,
  type updateTrainingPlanParamsSchema,
  type updateTrainingPlanRequestSchema,
} from "./training-plan-api.schema";

export type GetTrainingPlansResponse = z.infer<typeof getTrainingPlansResponseSchema>;
export type GetTrainingPlanByIdParams = z.infer<typeof getTrainingPlanByIdParamsSchema>;
export type GetTrainingPlanResponse = z.infer<typeof getTrainingPlanResponseSchema>;
export type CreateTrainingPlanRequest = z.infer<typeof createTrainingPlanRequestSchema>;
export type UpdateTrainingPlanParams = z.infer<typeof updateTrainingPlanParamsSchema>;
export type UpdateTrainingPlanRequest = z.infer<typeof updateTrainingPlanRequestSchema>;
export type DeleteTrainingPlanParams = z.infer<typeof deleteTrainingPlanParamsSchema>;
