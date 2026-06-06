import { z } from "zod";

import {
  exactOrRangeSchema,
  intensitySchema,
  loadSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  stagedProgramKindSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "../_shared";
import { positionSchema, rowKindSchema, schemaRowPayloadSchema } from "../schema-row";

import { PARALLEL_INTERLEAVE_ORDERS, WINDOW_HH_MM_PATTERN } from "./composition.constants";

const MINUTES_PER_HOUR = 60;

function hhMmToMinutes(value: string): number | null {
  const match = WINDOW_HH_MM_PATTERN.exec(value);

  if (match === null) {
    return null;
  }

  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * MINUTES_PER_HOUR + minutes;
}

export const repetitionAxisSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("once") }).strict(),
    z.object({ kind: z.literal("count"), count: exactOrRangeSchema }).strict(),
    z
      .object({
        kind: z.literal("range"),
        range: z
          .object({
            min: z.number().int().positive(),
            max: z.number().int().positive(),
          })
          .strict()
          .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
      })
      .strict(),
    z
      .object({
        kind: z.literal("ladder"),
        steps: z.array(z.number().int().positive()).min(1),
      })
      .strict(),
    z.object({ kind: z.literal("timeCap"), cap: timeCapSchema }).strict(),
    z
      .object({
        kind: z.literal("cadence"),
        everyMin: z.number().int().positive(),
        rounds: z.number().int().positive(),
        totalMin: z.number().int().positive().optional(),
      })
      .strict(),
    z
      .object({
        kind: z.literal("window"),
        startHhMm: z.string().regex(WINDOW_HH_MM_PATTERN),
        endHhMm: z.string().regex(WINDOW_HH_MM_PATTERN),
      })
      .strict(),
    z
      .object({
        kind: z.literal("interval"),
        workMin: z.number().int().positive(),
        offMin: z.number().int().nonnegative(),
        count: z.number().int().positive(),
      })
      .strict(),
  ])
  .superRefine((axis, ctx) => {
    if (axis.kind === "window") {
      const start = hhMmToMinutes(axis.startHhMm);
      const end = hhMmToMinutes(axis.endHhMm);

      if (start === null || end === null || start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endHhMm"],
          message: "window.endHhMm must be a valid HH:MM after startHhMm",
        });
      }
    }
  });

export const supersetPairSchema = z
  .object({
    label: z.string().min(1),
    rowIds: z.array(z.string().cuid()).min(2),
  })
  .strict()
  .refine((pair) => new Set(pair.rowIds).size === pair.rowIds.length, {
    message: "superset pair rowIds must be distinct",
    path: ["rowIds"],
  });

export const parallelTrackSchema = z
  .object({
    childSchemaId: z.string().cuid(),
    setEnumeration: z.array(z.number().int().positive()).min(1).optional(),
    pairedWithRowId: z.string().cuid().optional(),
  })
  .strict();

export const arrangementAxisSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("ordered") }).strict(),
    z
      .object({
        kind: z.literal("parallel"),
        interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS),
        tracks: z.array(parallelTrackSchema).min(2),
      })
      .strict(),
    z
      .object({
        kind: z.literal("superset"),
        pairs: z.array(supersetPairSchema).min(1),
      })
      .strict(),
  ])
  .superRefine((axis, ctx) => {
    if (axis.kind === "parallel") {
      const ids = axis.tracks.map((t) => t.childSchemaId);

      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tracks"],
          message: "parallel tracks must reference distinct childSchemaId",
        });
      }
    }
  });

export const scoringConditionSchema = z
  .object({
    appliesToRounds: z.array(z.number().int().positive()).min(1),
  })
  .strict();

export const scoringDirectiveSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prescribed") }).strict(),
  z.object({ kind: z.literal("amrap"), condition: scoringConditionSchema.optional() }).strict(),
  z.object({ kind: z.literal("for_time"), condition: scoringConditionSchema.optional() }).strict(),
  z
    .object({ kind: z.literal("max_in_remaining"), condition: scoringConditionSchema.optional() })
    .strict(),
  z.object({ kind: z.literal("total"), condition: scoringConditionSchema.optional() }).strict(),
  z
    .object({
      kind: z.literal("progressive"),
      seed: z.string().min(1),
      condition: scoringConditionSchema.optional(),
    })
    .strict(),
]);

export const restAxisSchema = restSpecSchema;

export const compositionSchema = z
  .object({
    repetition: repetitionAxisSchema.optional(),
    arrangement: arrangementAxisSchema.optional(),
    scoring: scoringDirectiveSchema.optional(),
    rest: restAxisSchema.optional(),
    programKind: stagedProgramKindSchema.optional(),
  })
  .strict();

type ComposeRowShape = {
  nodeType: "row";
  id: string;
  rowKind: z.infer<typeof rowKindSchema>;
  rowPayload: z.infer<typeof schemaRowPayloadSchema>;
  reps: z.infer<typeof repNotationSchema> | null;
  load: z.infer<typeof loadSchema> | null;
  side: z.infer<typeof perLimbDistributionSchema> | null;
  tempo: z.infer<typeof tempoModifierSchema> | null;
  position: z.infer<typeof positionSchema> | null;
  intensity: z.infer<typeof intensitySchema> | null;
  notes: string | null;
};

type ComposeContainerShape = {
  nodeType: "container";
  id: string;
  header: string | null;
  notes: string | null;
  composition: z.infer<typeof compositionSchema>;
  children: ComposeNodeShape[];
};

type ComposeNodeShape = ComposeContainerShape | ComposeRowShape;

export const composeRowSchema: z.ZodType<ComposeRowShape> = z
  .object({
    nodeType: z.literal("row"),
    id: z.string().cuid(),
    rowKind: rowKindSchema,
    rowPayload: schemaRowPayloadSchema,
    reps: repNotationSchema.nullable(),
    load: loadSchema.nullable(),
    side: perLimbDistributionSchema.nullable(),
    tempo: tempoModifierSchema.nullable(),
    position: positionSchema.nullable(),
    intensity: intensitySchema.nullable(),
    notes: z.string().nullable(),
  })
  .strict();

export const composeContainerSchema: z.ZodType<ComposeContainerShape> = z.lazy(() =>
  z
    .object({
      nodeType: z.literal("container"),
      id: z.string().cuid(),
      header: z.string().nullable(),
      notes: z.string().nullable(),
      composition: compositionSchema,
      children: z.array(composeNodeSchema),
    })
    .strict()
    .superRefine((container, ctx) => {
      if (container.composition.repetition?.kind !== "ladder") {
        return;
      }

      const hasRepSchemeChild = container.children.some(
        (child) => child.nodeType === "row" && child.rowPayload.rowKind === "INNER_LADDER_MARKER",
      );

      if (hasRepSchemeChild) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["composition", "repetition"],
          message: "a round-counter ladder container cannot also hold a rep-scheme ladder row",
        });
      }
    }),
);

export const composeNodeSchema: z.ZodType<ComposeNodeShape> = z.lazy(() =>
  z.union([composeContainerSchema, composeRowSchema]),
);
