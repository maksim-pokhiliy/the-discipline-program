import { type z } from "zod";

import {
  type getWeeklyVolumeResponseSchema,
  type listWeeklyVolumesQuerySchema,
  type listWeeklyVolumesResponseSchema,
  type weeklyVolumeIdParamSchema,
} from "./weekly-volume-api.schema";

export type WeeklyVolumeIdParam = z.infer<typeof weeklyVolumeIdParamSchema>;
export type ListWeeklyVolumesQuery = z.infer<typeof listWeeklyVolumesQuerySchema>;
export type ListWeeklyVolumesResponse = z.infer<typeof listWeeklyVolumesResponseSchema>;
export type GetWeeklyVolumeResponse = z.infer<typeof getWeeklyVolumeResponseSchema>;
