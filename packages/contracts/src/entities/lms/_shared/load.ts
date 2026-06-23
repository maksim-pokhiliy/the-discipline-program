import { z } from "zod";

export const LOAD_KINDS = ["absolute", "percentage", "bodyweight", "byProfile"] as const;

export const PERCENTAGE_REFERENCE_SCOPES = ["self", "other_exercise"] as const;

export const percentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

export const GENDER_AXIS_COORDS = { MALE: "Male", FEMALE: "Female" } as const;

export const GENDER_AXIS_VALUES = Object.values(GENDER_AXIS_COORDS);

export const byProfileAxisSchema = z.object({
  axisId: z.string().cuid(),
  label: z.string().trim().min(1),
  values: z.array(z.string().trim().min(1)).min(1),
  binding: z.literal("GENDER").nullable(),
});

type ByProfileAxis = z.infer<typeof byProfileAxisSchema>;

const axisValueSet = (axis: ByProfileAxis): readonly string[] => axis.values;

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
      axes: z.array(byProfileAxisSchema).min(1).max(2),
      cells: z
        .array(
          z.object({
            coords: z.array(z.string().trim().min(1)).min(1).max(2),
            kg: z.number().positive(),
          }),
        )
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

    if (l.kind === "byProfile") {
      l.axes.forEach((axis, axisIndex) => {
        const seenValues = new Set<string>();

        axis.values.forEach((value) => {
          if (seenValues.has(value)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["axes", axisIndex, "values"],
              message: "byProfile axis has duplicate values; each value must be unique",
            });
          }

          seenValues.add(value);
        });
      });

      const expectedCellCount = l.axes.reduce(
        (product, axis) => product * axisValueSet(axis).length,
        1,
      );

      if (l.cells.length !== expectedCellCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cells"],
          message: `byProfile.cells must cover every combination of axis values (expected ${expectedCellCount}, got ${l.cells.length})`,
        });
      }

      const seenCoordKeys = new Set<string>();

      l.cells.forEach((cell, cellIndex) => {
        if (cell.coords.length !== l.axes.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cells", cellIndex, "coords"],
            message: `byProfile cell coords must have one value per axis (expected ${l.axes.length}, got ${cell.coords.length})`,
          });

          return;
        }

        cell.coords.forEach((coord, axisIndex) => {
          const axis = l.axes[axisIndex];

          if (axis === undefined || axisValueSet(axis).includes(coord)) {
            return;
          }

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cells", cellIndex, "coords", axisIndex],
            message: `byProfile coord "${coord}" is not a valid value for this axis`,
          });
        });

        const coordKey = cell.coords.join("|");

        if (seenCoordKeys.has(coordKey)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cells", cellIndex, "coords"],
            message: "byProfile cells must have unique coords",
          });
        }

        seenCoordKeys.add(coordKey);
      });

      const axisKeys = l.axes.map((axis) => axis.axisId);

      if (new Set(axisKeys).size !== axisKeys.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["axes"],
          message: "byProfile axes must be distinct dimensions",
        });
      }
    }
  });

export type Load = z.infer<typeof loadSchema>;
export type LoadKind = (typeof LOAD_KINDS)[number];
export type PercentageReference = z.infer<typeof percentageReferenceSchema>;
export type PercentageReferenceScope = (typeof PERCENTAGE_REFERENCE_SCOPES)[number];
