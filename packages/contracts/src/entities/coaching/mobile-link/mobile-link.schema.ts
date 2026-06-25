import { z } from "zod";

export const mobileLinkSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  channel: z.literal("GENERAL"),
  legacyLevelId: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createMobileLinkSchema = z.object({
  planId: z.string().cuid(),
  legacyLevelId: z.number().int(),
});
