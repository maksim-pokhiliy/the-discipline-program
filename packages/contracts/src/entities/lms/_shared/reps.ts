import { z } from "zod";

export const REP_UNITS = ["sec", "min", "km"] as const;

export const REP_NOTATION_KINDS = ["count", "range", "unit_bound", "max"] as const;

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
    z.object({ kind: z.literal("max"), tail: z.string().min(1).optional() }),
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

export type RepNotation = z.infer<typeof repNotationSchema>;
export type RepNotationKind = (typeof REP_NOTATION_KINDS)[number];
export type RepUnit = (typeof REP_UNITS)[number];
