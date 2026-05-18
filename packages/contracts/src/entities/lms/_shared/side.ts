import { z } from "zod";

export const PER_LIMB_KINDS = ["each_leg", "each_arm", "explicit_split", "alternating"] as const;

export const EXPLICIT_SPLIT_SIDES = ["left", "right"] as const;

export const perLimbDistributionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("each_leg"),
    countPerLimb: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("each_arm"),
    countPerLimb: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("explicit_split"),
    side: z.enum(EXPLICIT_SPLIT_SIDES),
    pairedRowId: z.string().cuid().optional(),
  }),
  z.object({
    kind: z.literal("alternating"),
    sourceAnnotation: z.string().min(1).optional(),
  }),
]);

export type PerLimbDistribution = z.infer<typeof perLimbDistributionSchema>;
export type PerLimbKind = (typeof PER_LIMB_KINDS)[number];
export type ExplicitSplitSide = (typeof EXPLICIT_SPLIT_SIDES)[number];
