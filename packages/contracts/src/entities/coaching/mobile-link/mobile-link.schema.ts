import { z } from "zod";

export const publishAggregateSchema = z.object({
  publishedDayCount: z.number().int().nonnegative(),
  lastPublishedAt: z.date().nullable(),
});

const baseMobileLinkSchema = z.object({
  id: z.string().cuid(),
  planId: z.string().cuid(),
  publishedDayCount: z.number().int().nonnegative(),
  lastPublishedAt: z.date().nullable(),
  weekPublish: publishAggregateSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const generalMobileLinkSchema = baseMobileLinkSchema.extend({
  channel: z.literal("GENERAL"),
  legacyLevelId: z.number().int(),
  legacyUserId: z.null(),
  athleteId: z.null(),
});

export const individualMobileLinkSchema = baseMobileLinkSchema.extend({
  channel: z.literal("INDIVIDUAL"),
  legacyLevelId: z.null(),
  legacyUserId: z.number().int(),
  athleteId: z.string().cuid(),
});

export const mobileLinkSchema = z.discriminatedUnion("channel", [
  generalMobileLinkSchema,
  individualMobileLinkSchema,
]);

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
