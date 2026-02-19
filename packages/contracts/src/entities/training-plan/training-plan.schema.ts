import { z } from "zod";

export const trainingPlanSchema = z.object({
  id: z.string().cuid(),
  coachId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTrainingPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateTrainingPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});
