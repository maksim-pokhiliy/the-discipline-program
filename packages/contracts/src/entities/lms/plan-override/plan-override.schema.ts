import { z } from "zod";

import { blockSchema } from "../block/block.schema";
import { blockSegmentSchema } from "../block-segment/block-segment.schema";
import { daySchema } from "../day/day.schema";
import { exerciseEntrySchema } from "../exercise-entry/exercise-entry.schema";
import { lmsSessionSchema } from "../lms-session/lms-session.schema";

import { PlanOverrideKind, PlanOverrideScope } from "./plan-override.constants";

export const planOverrideScopeSchema = z.nativeEnum(PlanOverrideScope);
export const planOverrideKindSchema = z.nativeEnum(PlanOverrideKind);

export const planOverridePayloadSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("REPLACE"),
    snapshot: z.union([
      daySchema,
      lmsSessionSchema,
      blockSchema,
      blockSegmentSchema,
      exerciseEntrySchema,
    ]),
  }),
  z.object({
    kind: z.literal("APPEND"),
    entries: z.array(exerciseEntrySchema).min(1),
  }),
  z.object({
    kind: z.literal("SUSPEND"),
  }),
  z.object({
    kind: z.literal("NOTE"),
    markdown: z.string().max(10_000),
  }),
]);

export const planOverrideSchema = z.object({
  id: z.string().cuid(),
  enrollmentId: z.string().cuid(),
  scope: planOverrideScopeSchema,
  scopeId: z.string().cuid(),
  kind: planOverrideKindSchema,
  payload: planOverridePayloadSchema,
  startsOnWeekIndex: z.number().int().nonnegative().nullable(),
  endsOnWeekIndex: z.number().int().nonnegative().nullable(),
  createdAt: z.date(),
});
