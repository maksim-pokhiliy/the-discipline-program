import { z } from "zod";

import { blockSchema } from "../block/block.schema";
import { blockSegmentSchema } from "../block-segment/block-segment.schema";
import { daySchema } from "../day/day.schema";
import { exerciseEntrySchema } from "../exercise-entry/exercise-entry.schema";
import { lmsSessionSchema } from "../lms-session/lms-session.schema";
import { setGroupSchema } from "../set-group/set-group.schema";
import { weekSchema } from "../week/week.schema";

const blockTemplateEntrySchema = exerciseEntrySchema.omit({
  id: true,
  setGroupId: true,
  version: true,
});

const blockTemplateSetGroupSchema = setGroupSchema
  .omit({ id: true, segmentId: true })
  .extend({ entries: z.array(blockTemplateEntrySchema) });

const blockTemplateSegmentSchema = blockSegmentSchema
  .omit({ id: true, blockId: true, version: true })
  .extend({ setGroups: z.array(blockTemplateSetGroupSchema) });

const blockTemplateBlockSchema = blockSchema.omit({
  id: true,
  sessionId: true,
  version: true,
});

export const blockTemplatePayloadSchema = z.object({
  block: blockTemplateBlockSchema,
  segments: z.array(blockTemplateSegmentSchema),
});

const sessionTemplateSessionSchema = lmsSessionSchema.omit({ id: true, dayId: true });

export const sessionTemplatePayloadSchema = z.object({
  session: sessionTemplateSessionSchema,
  blocks: z.array(blockTemplatePayloadSchema),
});

const weekTemplateDaySchema = daySchema
  .omit({ id: true, weekId: true })
  .extend({ sessions: z.array(sessionTemplatePayloadSchema) });

const weekTemplateWeekSchema = weekSchema.omit({ id: true, planId: true, index: true });

export const weekTemplatePayloadSchema = z.object({
  week: weekTemplateWeekSchema,
  days: z.array(weekTemplateDaySchema),
});
