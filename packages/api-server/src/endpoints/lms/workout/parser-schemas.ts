import { z } from "zod";

import { SchemeKind } from "@repo/contracts/library/scheme";
import { prescriptionSchema, WorkoutRepScheme } from "@repo/contracts/lms/workout-block";

export const EMOM_NODE_TYPE = "emom" as const;

export const EMOM_SLOT_NODE_TYPE = "emomSlot" as const;

export const EXERCISE_MENTION_NODE_TYPE = "exerciseMention" as const;

export const SCHEMELESS_BLOCK_NODE_TYPES = new Set<string>(["notes", "textCallout"]);

export const BLOCK_KIND_TO_SCHEME_KIND: Record<string, SchemeKind | null> = {
  straightSets: SchemeKind.STRAIGHT_SETS,
  forTime: SchemeKind.FOR_TIME,
  amrap: SchemeKind.AMRAP,
  emom: SchemeKind.EMOM,
  everyXMin: SchemeKind.EVERY_X_MIN,
  intervals: SchemeKind.INTERVALS,
  timeBlocks: SchemeKind.TIME_BLOCKS,
  notes: null,
  textCallout: null,
};

export const blockAttrsSchema = z.object({
  blockTypeId: z.string().min(1),
  schemeId: z.string().min(1).optional().nullable(),
  schemeConfig: z.record(z.string(), z.number()).optional().nullable(),
  effortPct: z.number().int().min(0).max(100).optional().nullable(),
  pace: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const schemelessBlockAttrsSchema = z.object({
  blockTypeId: z.string().min(1),
  note: z.string().optional().nullable(),
});

export const exerciseMentionAttrsSchema = z.object({
  exerciseId: z.string().min(1),
  repScheme: z.nativeEnum(WorkoutRepScheme).optional(),
  repValues: z.array(z.number().int().nonnegative()).optional(),
  sets: z.number().int().positive().optional().nullable(),
  prescription: prescriptionSchema.optional().nullable(),
  restSec: z.number().int().nonnegative().optional().nullable(),
  note: z.string().optional().nullable(),
  complexGroup: z.string().optional().nullable(),
  complexOrder: z.number().int().nonnegative().optional().nullable(),
});

export const emomSlotAttrsSchema = z.object({
  minuteInRound: z.number().int().nonnegative(),
  note: z.string().optional().nullable(),
});

export const toNodePath = (...segments: (string | number)[]): string => segments.join(".");
