import { type z } from "zod";

import {
  type cloneWeekFromRequestSchema,
  type cloneWeekResponseSchema,
  type getWeekResponseSchema,
  type updateWeekNotesRequestSchema,
  type updateWeekNotesResponseSchema,
  type weekByPlanAndDateParamsSchema,
} from "./week-api.schema";

export type WeekByPlanAndDateParams = z.infer<typeof weekByPlanAndDateParamsSchema>;
export type GetWeekResponse = z.infer<typeof getWeekResponseSchema>;
export type UpdateWeekNotesRequest = z.infer<typeof updateWeekNotesRequestSchema>;
export type UpdateWeekNotesResponse = z.infer<typeof updateWeekNotesResponseSchema>;
export type CloneWeekFromRequest = z.infer<typeof cloneWeekFromRequestSchema>;
export type CloneWeekResponse = z.infer<typeof cloneWeekResponseSchema>;
