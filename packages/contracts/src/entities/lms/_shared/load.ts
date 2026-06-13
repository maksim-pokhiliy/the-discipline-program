import { z } from "zod";

export const LOAD_KINDS = ["absolute", "percentage", "bodyweight", "byProfile"] as const;

export const PERCENTAGE_REFERENCE_SCOPES = ["self", "other_exercise"] as const;

export const percentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

export const loadSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("absolute"),
      count: z.union([z.literal(1), z.literal(2)]),
      kg: z.number().positive(),
    }),
    z.object({
      kind: z.literal("percentage"),
      value: z.number().min(0).max(200),
      rangeMax: z.number().min(0).max(200).optional(),
      reference: percentageReferenceSchema,
    }),
    z.object({ kind: z.literal("bodyweight") }),
    z.object({
      kind: z.literal("byProfile"),
      entries: z
        .array(z.object({ label: z.string().trim().min(1), kg: z.number().positive() }))
        .min(1),
    }),
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
