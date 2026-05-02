import { z } from "zod";

import { weeklyVolumeSchema } from "./weekly-volume.schema";

export const weeklyVolumeIdParamSchema = z.object({
  weeklyVolumeId: z.string().cuid(),
});

export const listWeeklyVolumesQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  take: z.coerce.number().int().min(1).max(500).optional(),
});

export const listWeeklyVolumesResponseSchema = z.object({
  items: z.array(weeklyVolumeSchema),
  total: z.number().int().nonnegative(),
});

export const getWeeklyVolumeResponseSchema = weeklyVolumeSchema;
