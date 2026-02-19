import { type z } from "zod";

import {
  type createTrainingPlanRequestSchema,
  type createTrainingPlanResponseSchema,
  type deleteTrainingPlanParamsSchema,
  type getTrainingPlanByIdParamsSchema,
  type getTrainingPlanResponseSchema,
  type getTrainingPlansResponseSchema,
  type updateTrainingPlanParamsSchema,
  type updateTrainingPlanRequestSchema,
  type updateTrainingPlanResponseSchema,
} from "./training-plan-api.schema";

export type GetTrainingPlansResponse = z.infer<typeof getTrainingPlansResponseSchema>;
export type GetTrainingPlanByIdParams = z.infer<typeof getTrainingPlanByIdParamsSchema>;
export type GetTrainingPlanResponse = z.infer<typeof getTrainingPlanResponseSchema>;
export type CreateTrainingPlanRequest = z.infer<typeof createTrainingPlanRequestSchema>;
export type CreateTrainingPlanResponse = z.infer<typeof createTrainingPlanResponseSchema>;
export type UpdateTrainingPlanParams = z.infer<typeof updateTrainingPlanParamsSchema>;
export type UpdateTrainingPlanRequest = z.infer<typeof updateTrainingPlanRequestSchema>;
export type UpdateTrainingPlanResponse = z.infer<typeof updateTrainingPlanResponseSchema>;
export type DeleteTrainingPlanParams = z.infer<typeof deleteTrainingPlanParamsSchema>;
