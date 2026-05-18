import { z } from "zod";

import { weightSchema } from "./weight";

export const LOAD_KINDS = [
  "absolute",
  "percentage",
  "bodyweight",
  "without_weight",
  "unspecified",
] as const;

export const PERCENTAGE_REFERENCE_SCOPES = ["self", "movement_family", "other_exercise"] as const;

export const WITHOUT_WEIGHT_CONTEXTS = ["drop_set_stage"] as const;

export const percentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("movement_family"), movementFamily: z.string().min(1) }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

export const loadSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("absolute"), weight: weightSchema }),
    z.object({
      kind: z.literal("percentage"),
      value: z.number().min(0).max(200),
      rangeMax: z.number().min(0).max(200).optional(),
      reference: percentageReferenceSchema,
    }),
    z.object({ kind: z.literal("bodyweight") }),
    z.object({ kind: z.literal("without_weight"), context: z.enum(WITHOUT_WEIGHT_CONTEXTS) }),
    z.object({ kind: z.literal("unspecified") }),
  ])
  .superRefine((l, ctx) => {
    if (l.kind === "percentage" && l.rangeMax !== undefined && l.rangeMax <= l.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percentage.rangeMax must be > value when set",
      });
    }
  });

export type Load = z.infer<typeof loadSchema>;
export type LoadKind = (typeof LOAD_KINDS)[number];
export type PercentageReference = z.infer<typeof percentageReferenceSchema>;
export type PercentageReferenceScope = (typeof PERCENTAGE_REFERENCE_SCOPES)[number];
export type WithoutWeightContext = (typeof WITHOUT_WEIGHT_CONTEXTS)[number];
