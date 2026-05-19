import { z } from "zod";

export const REST_SCOPES = [
  "between_sets",
  "between_rounds",
  "between_intervals",
  "after_specific_set",
] as const;

export const REST_QUALIFIERS = ["until_recovery", "fixed", "range"] as const;

export const REST_DURATION_UNITS = ["sec", "min", "range_sec", "range_min"] as const;

export const SLOT_SPEC_KINDS = ["single", "grouped"] as const;

export const restSpecSchema = z.object({
  duration: z
    .object({
      value: z.number().positive(),
      unit: z.enum(REST_DURATION_UNITS),
      rangeMax: z.number().positive().optional(),
    })
    .refine(
      (d) => {
        const isRange = d.unit === "range_sec" || d.unit === "range_min";

        if (isRange) {
          return d.rangeMax !== undefined && d.rangeMax > d.value;
        }

        return d.rangeMax === undefined;
      },
      { message: "rangeMax required when unit is range_*, must be > value; forbidden otherwise" },
    ),
  scope: z.enum(REST_SCOPES),
  qualifier: z.enum(REST_QUALIFIERS).optional(),
  setIndex: z.number().int().positive().optional(),
});

export const slotSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("single"), minute: z.number().int().positive() }),
  z.object({
    kind: z.literal("grouped"),
    minutes: z.array(z.number().int().positive()).min(2),
  }),
]);

export type RestSpec = z.infer<typeof restSpecSchema>;
export type RestScope = (typeof REST_SCOPES)[number];
export type RestQualifier = (typeof REST_QUALIFIERS)[number];
export type RestDurationUnit = (typeof REST_DURATION_UNITS)[number];
export type SlotSpec = z.infer<typeof slotSpecSchema>;
export type SlotSpecKind = (typeof SLOT_SPEC_KINDS)[number];
