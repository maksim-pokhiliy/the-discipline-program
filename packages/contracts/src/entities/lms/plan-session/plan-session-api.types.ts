import { type z } from "zod";

import {
  type createPlanSessionRequestSchema,
  type createPlanSessionResponseSchema,
  type getPlanSessionResponseSchema,
  type getPlanSessionsResponseSchema,
  type planSessionParamsSchema,
  type planSessionsByDayParamsSchema,
  type updatePlanSessionRequestSchema,
  type updatePlanSessionResponseSchema,
} from "./plan-session-api.schema";

export type PlanSessionParams = z.infer<typeof planSessionParamsSchema>;
export type PlanSessionsByDayParams = z.infer<typeof planSessionsByDayParamsSchema>;
export type GetPlanSessionsResponse = z.infer<typeof getPlanSessionsResponseSchema>;
export type GetPlanSessionResponse = z.infer<typeof getPlanSessionResponseSchema>;
export type CreatePlanSessionRequest = z.infer<typeof createPlanSessionRequestSchema>;
export type CreatePlanSessionResponse = z.infer<typeof createPlanSessionResponseSchema>;
export type UpdatePlanSessionRequest = z.infer<typeof updatePlanSessionRequestSchema>;
export type UpdatePlanSessionResponse = z.infer<typeof updatePlanSessionResponseSchema>;
