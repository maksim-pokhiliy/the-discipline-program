import { z } from "zod";

import { TrainingPlanStatus } from "./training-plan.constants";

export const trainingPlanStatusSchema = z.nativeEnum(TrainingPlanStatus);

export const trainingPlanSchema = z.object({
  id: z.string().cuid(),
  coachId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  status: trainingPlanStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTrainingPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateTrainingPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const trainingPlanListItemSchema = trainingPlanSchema.extend({
  enrolledAthletesCount: z.number().int(),
  weeklyComplianceRate: z.number().min(0).max(100).nullable(),
});
