import { type z } from "zod";

import {
  type createWeekInputSchema,
  type createWeekResponseSchema,
  type duplicateWeekInputSchema,
  type duplicateWeekResponseSchema,
  type getWeekResponseSchema,
  type listPlanWeeksResponseSchema,
  type planWeekParamSchema,
  type updateWeekInputSchema,
  type updateWeekResponseSchema,
  type weekIdParamSchema,
} from "./week-api.schema";

export type CreateWeekInput = z.infer<typeof createWeekInputSchema>;
export type UpdateWeekInput = z.infer<typeof updateWeekInputSchema>;
export type DuplicateWeekInput = z.infer<typeof duplicateWeekInputSchema>;
export type WeekIdParam = z.infer<typeof weekIdParamSchema>;
export type PlanWeekParam = z.infer<typeof planWeekParamSchema>;
export type ListPlanWeeksResponse = z.infer<typeof listPlanWeeksResponseSchema>;
export type GetWeekResponse = z.infer<typeof getWeekResponseSchema>;
export type CreateWeekResponse = z.infer<typeof createWeekResponseSchema>;
export type UpdateWeekResponse = z.infer<typeof updateWeekResponseSchema>;
export type DuplicateWeekResponse = z.infer<typeof duplicateWeekResponseSchema>;
