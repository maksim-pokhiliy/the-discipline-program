import { type z } from "zod";

import {
  type cloneWeekFromRequestSchema,
  type cloneWeekResponseSchema,
  type getWeekResponseSchema,
  type listPopulatedWeeksParamsSchema,
  type populatedWeekSchema,
  type populatedWeeksResponseSchema,
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
export type ListPopulatedWeeksParams = z.infer<typeof listPopulatedWeeksParamsSchema>;
export type PopulatedWeek = z.infer<typeof populatedWeekSchema>;
export type PopulatedWeeksResponse = z.infer<typeof populatedWeeksResponseSchema>;
