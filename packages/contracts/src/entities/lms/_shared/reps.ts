import { z } from "zod";

export const REP_UNITS = ["sec", "min", "km"] as const;

export const REP_NOTATION_KINDS = [
  "count",
  "range",
  "unit_bound",
  "max",
  "implicit",
  "total_flag",
  "compound_rep_unit",
] as const;

export const MAX_SUB_FORMS = ["bare", "progressive", "in_remaining_time"] as const;

export const COMPOUND_REP_DEFINITION_FORMS = ["curly_brace", "inline_equality"] as const;

export const repNotationSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("count"), value: z.number().int().positive() }),
    z.object({
      kind: z.literal("range"),
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    }),
    z.object({
      kind: z.literal("unit_bound"),
      unit: z.enum(REP_UNITS),
      value: z.number().positive().optional(),
      range: z
        .object({
          min: z.number().positive(),
          max: z.number().positive(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal("max"),
      subForm: z.enum(MAX_SUB_FORMS),
      progressiveSeed: z.string().min(1).optional(),
      targetExerciseId: z.string().cuid().optional(),
    }),
    z.object({ kind: z.literal("implicit") }),
    z.object({ kind: z.literal("total_flag"), value: z.number().int().positive() }),
    z.object({ kind: z.literal("compound_rep_unit") }),
  ])
  .superRefine((r, ctx) => {
    if (r.kind === "range" && r.min >= r.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "range.min must be < range.max",
      });
    }

    if (r.kind === "unit_bound") {
      if (r.value === undefined && r.range === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "unit_bound needs value or range",
        });
      }

      if (r.value !== undefined && r.range !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "unit_bound cannot have both value and range",
        });
      }

      if (r.range !== undefined && r.range.min >= r.range.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "range.min must be < range.max",
        });
      }
    }
  });

export const compoundRepDefinitionSchema = z.discriminatedUnion("form", [
  z.object({
    form: z.literal("curly_brace"),
    composition: z
      .array(
        z.object({
          exerciseId: z.string().cuid(),
          count: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  z.object({
    form: z.literal("inline_equality"),
    totalReps: z.number().int().positive(),
    composition: z
      .array(
        z.object({
          exerciseId: z.string().cuid(),
          count: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
]);

export type RepNotation = z.infer<typeof repNotationSchema>;
export type RepNotationKind = (typeof REP_NOTATION_KINDS)[number];
export type RepUnit = (typeof REP_UNITS)[number];
export type CompoundRepDefinition = z.infer<typeof compoundRepDefinitionSchema>;
export type MaxSubForm = (typeof MAX_SUB_FORMS)[number];
export type CompoundRepDefinitionForm = (typeof COMPOUND_REP_DEFINITION_FORMS)[number];
