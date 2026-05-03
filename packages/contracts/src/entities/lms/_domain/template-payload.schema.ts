import { z } from "zod";

import { blockSchema } from "../block/block.schema";
import { blockSegmentSchema } from "../block-segment/block-segment.schema";
import { daySchema } from "../day/day.schema";
import { exerciseEntrySchema } from "../exercise-entry/exercise-entry.schema";
import { lmsSessionSchema } from "../lms-session/lms-session.schema";
import { setGroupSchema } from "../set-group/set-group.schema";
import { weekSchema } from "../week/week.schema";

import { TEMPLATE_LIMITS } from "./template-limits.constants";

const blockTemplateEntrySchema = exerciseEntrySchema.omit({
  id: true,
  setGroupId: true,
  version: true,
});

const blockTemplateSetGroupSchema = setGroupSchema.omit({ id: true, segmentId: true }).extend({
  entries: z.array(blockTemplateEntrySchema).max(TEMPLATE_LIMITS.MAX_ENTRIES_PER_SET_GROUP),
});

const blockTemplateSegmentSchema = blockSegmentSchema
  .omit({ id: true, blockId: true, version: true })
  .extend({
    setGroups: z.array(blockTemplateSetGroupSchema).max(TEMPLATE_LIMITS.MAX_SET_GROUPS_PER_SEGMENT),
  });

const blockTemplateBlockSchema = blockSchema.omit({
  id: true,
  sessionId: true,
  version: true,
});

export const blockTemplatePayloadSchema = z.object({
  block: blockTemplateBlockSchema,
  segments: z.array(blockTemplateSegmentSchema).max(TEMPLATE_LIMITS.MAX_SEGMENTS_PER_BLOCK),
});

const sessionTemplateSessionSchema = lmsSessionSchema.omit({
  id: true,
  dayId: true,
  version: true,
});

export const sessionTemplatePayloadSchema = z.object({
  session: sessionTemplateSessionSchema,
  blocks: z.array(blockTemplatePayloadSchema).max(TEMPLATE_LIMITS.MAX_BLOCKS_PER_SESSION),
});

const weekTemplateDaySchema = daySchema.omit({ id: true, weekId: true, version: true }).extend({
  sessions: z.array(sessionTemplatePayloadSchema).max(TEMPLATE_LIMITS.MAX_SESSIONS_PER_DAY),
});

const weekTemplateWeekSchema = weekSchema.omit({
  id: true,
  planId: true,
  index: true,
  version: true,
});

export const weekTemplatePayloadSchema = z.object({
  week: weekTemplateWeekSchema,
  days: z.array(weekTemplateDaySchema).max(TEMPLATE_LIMITS.MAX_DAYS_PER_WEEK),
});
