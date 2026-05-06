import { type z } from "zod";

import {
  type createPlanBlockRequestSchema,
  type createPlanBlockResponseSchema,
  type getPlanBlockResponseSchema,
  type getPlanBlocksResponseSchema,
  type planBlockParamsSchema,
  type planBlocksBySessionParamsSchema,
  type updatePlanBlockRequestSchema,
  type updatePlanBlockResponseSchema,
} from "./plan-block-api.schema";

export type PlanBlockParams = z.infer<typeof planBlockParamsSchema>;
export type PlanBlocksBySessionParams = z.infer<typeof planBlocksBySessionParamsSchema>;
export type GetPlanBlocksResponse = z.infer<typeof getPlanBlocksResponseSchema>;
export type GetPlanBlockResponse = z.infer<typeof getPlanBlockResponseSchema>;
export type CreatePlanBlockRequest = z.infer<typeof createPlanBlockRequestSchema>;
export type CreatePlanBlockResponse = z.infer<typeof createPlanBlockResponseSchema>;
export type UpdatePlanBlockRequest = z.infer<typeof updatePlanBlockRequestSchema>;
export type UpdatePlanBlockResponse = z.infer<typeof updatePlanBlockResponseSchema>;
