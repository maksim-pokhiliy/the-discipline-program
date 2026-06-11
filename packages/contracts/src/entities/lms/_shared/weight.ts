import { z } from "zod";

export const WEIGHT_VARIANTS = [
  "single",
  "dual",
  "single_arm",
  "compound_device",
  "split_tier",
  "with_asymmetric_arm",
  "with_depth_modifier",
] as const;

export const WEIGHT_COMPOUND_DEVICE_EQUIPMENT = [
  "BODYWEIGHT",
  "DUMBBELL",
  "KETTLEBELL",
  "BARBELL",
  "BAND",
  "PARALLEL_BARS",
  "RINGS",
  "BOX",
  "SOFA",
  "BOX_OR_SOFA",
  "MIXED",
  "UNKNOWN",
] as const;

export const WEIGHT_SPLIT_TIER_EQUIPMENT = ["DUMBBELL", "KETTLEBELL", "BARBELL", "MIXED"] as const;

export const WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT = ["DUMBBELL", "KETTLEBELL"] as const;

export const WEIGHT_WORKING_ARMS = ["left", "right"] as const;

export const WEIGHT_PASSIVE_ARM_ACTIONS = [
  "hold_in_up",
  "hold_static",
  "hold_with_extra_weight",
] as const;

export const WEIGHT_DEPTH_MODIFIERS = ["to_parallel", "full_rom", "partial"] as const;

export const weightSchema = z.discriminatedUnion("variant", [
  z.object({ variant: z.literal("single"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("dual"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("single_arm"), valueKg: z.number().positive() }),
  z.object({
    variant: z.literal("compound_device"),
    equipment: z.enum(WEIGHT_COMPOUND_DEVICE_EQUIPMENT),
    count: z.union([z.literal(1), z.literal(2)]),
    valueKg: z.number().positive(),
  }),
  z.object({
    variant: z.literal("split_tier"),
    stages: z
      .array(
        z.object({
          reps: z.number().int().positive(),
          equipment: z.enum(WEIGHT_SPLIT_TIER_EQUIPMENT),
          valueKg: z.number().positive(),
        }),
      )
      .min(2),
  }),
  z.object({
    variant: z.literal("with_asymmetric_arm"),
    valueKg: z.number().positive(),
    workingArm: z.enum(WEIGHT_WORKING_ARMS),
    passiveArmAction: z.enum(WEIGHT_PASSIVE_ARM_ACTIONS),
    passiveExtraWeight: z
      .object({
        equipment: z.enum(WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT),
        valueKg: z.number().positive(),
      })
      .optional(),
  }),
  z.object({
    variant: z.literal("with_depth_modifier"),
    valueKg: z.number().positive(),
    depth: z.enum(WEIGHT_DEPTH_MODIFIERS),
  }),
]);

export type Weight = z.infer<typeof weightSchema>;
export type WeightVariant = (typeof WEIGHT_VARIANTS)[number];
export type WeightCompoundDeviceEquipment = (typeof WEIGHT_COMPOUND_DEVICE_EQUIPMENT)[number];
export type WeightSplitTierEquipment = (typeof WEIGHT_SPLIT_TIER_EQUIPMENT)[number];
export type WeightAsymmetricPassiveEquipment = (typeof WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT)[number];
export type WeightWorkingArm = (typeof WEIGHT_WORKING_ARMS)[number];
export type WeightPassiveArmAction = (typeof WEIGHT_PASSIVE_ARM_ACTIONS)[number];
export type WeightDepthModifier = (typeof WEIGHT_DEPTH_MODIFIERS)[number];
