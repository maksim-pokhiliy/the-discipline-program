import { z } from "zod";

import {
  exactOrRangeSchema,
  intensitySchema,
  loadSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  tempoModifierSchema,
  timeCapSchema,
} from "../_shared";
import { positionSchema, rowKindSchema, schemaRowPayloadSchema } from "../schema-row";

import { PARALLEL_INTERLEAVE_ORDERS } from "./composition.constants";

export const repetitionAxisSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("once") }).strict(),
  z.object({ kind: z.literal("count"), count: exactOrRangeSchema }).strict(),
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
]);

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

export const arrangementAxisSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ordered") }).strict(),
  z
    .object({
      kind: z.literal("superset"),
      pairs: z.array(supersetPairSchema).min(1),
    })
    .strict(),
]);

export const restAxisSchema = restSpecSchema;

export const compositionSchema = z
  .object({
    repetition: repetitionAxisSchema.optional(),
    arrangement: arrangementAxisSchema.optional(),
    interleaveOrder: z.enum(PARALLEL_INTERLEAVE_ORDERS).optional(),
    rest: restAxisSchema.optional(),
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
