import { type z } from "zod";

import {
  type getPlanStructureParamsSchema,
  type getPlanStructureQuerySchema,
  type getPlanStructureResponseSchema,
  type planStructureBlockSchema,
  type planStructureDaySchema,
  type planStructurePlanSchema,
  type planStructureSegmentSchema,
  type planStructureSessionSchema,
  type planStructureSetGroupSchema,
  type planStructureWeekSchema,
  type planStructureWindowSchema,
} from "./plan-structure-api.schema";

export type GetPlanStructureParams = z.infer<typeof getPlanStructureParamsSchema>;
export type GetPlanStructureQuery = z.infer<typeof getPlanStructureQuerySchema>;
export type GetPlanStructureResponse = z.infer<typeof getPlanStructureResponseSchema>;

export type PlanStructureSetGroup = z.infer<typeof planStructureSetGroupSchema>;
export type PlanStructureSegment = z.infer<typeof planStructureSegmentSchema>;
export type PlanStructureBlock = z.infer<typeof planStructureBlockSchema>;
export type PlanStructureSession = z.infer<typeof planStructureSessionSchema>;
export type PlanStructureDay = z.infer<typeof planStructureDaySchema>;
export type PlanStructureWeek = z.infer<typeof planStructureWeekSchema>;
export type PlanStructurePlan = z.infer<typeof planStructurePlanSchema>;
export type PlanStructureWindow = z.infer<typeof planStructureWindowSchema>;
