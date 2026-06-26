import { z } from "zod";

export const mobileLinkSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  channel: z.enum(["GENERAL", "INDIVIDUAL"]),
  legacyLevelId: z.number().int().nullable(),
  legacyUserId: z.number().int().nullable(),
  athleteId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createMobileLinkSchema = z.object({
  planId: z.string().cuid(),
  legacyLevelId: z.number().int(),
});

export const createIndividualMobileLinkSchema = z.object({
  planId: z.string().cuid(),
  channel: z.literal("INDIVIDUAL"),
  athleteId: z.string().cuid(),
  legacyUserId: z.number().int(),
});
