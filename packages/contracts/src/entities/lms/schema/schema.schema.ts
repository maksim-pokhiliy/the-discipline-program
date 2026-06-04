import { z } from "zod";

import { connectorFormSchema, intensitySchema } from "../_shared";
import { compositionLabelSchema, compositionSchema } from "../composition";
import { type SchemaRow, schemaRowSchema } from "../schema-row";

import { archetypeParamsSchema } from "./archetype-params.schema";
import {
  ARCHETYPE_FAMILIES,
  ARCHETYPE_NAMES,
  SCHEMA_CONSTANTS,
  SCHEMA_KINDS,
  SUB_SCHEMA_ALLOWED_KINDS,
} from "./schema.constants";

export const schemaKindSchema = z.enum(SCHEMA_KINDS);
export const archetypeFamilySchema = z.enum(ARCHETYPE_FAMILIES);
export const archetypeNameSchema = z.enum(ARCHETYPE_NAMES);

export const trailingConnectorSchema = z
  .object({
    form: connectorFormSchema,
    roundsCount: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.form === "then_n_rounds" && value.roundsCount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roundsCount"],
        message: "roundsCount is required when form is then_n_rounds",
      });
    }

    if (value.form !== "then_n_rounds" && value.roundsCount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roundsCount"],
        message: "roundsCount is only allowed when form is then_n_rounds",
      });
    }
  });

type SchemaShape = {
  id: string;
  blockId: string;
  parentSchemaId: string | null;
  alternatingGroupId: string | null;
  order: number;
  kind: z.infer<typeof schemaKindSchema> | null;
  archetypeId: string | null;
  header: string | null;
  archetypeParams: z.infer<typeof archetypeParamsSchema> | null;
  intensity: z.infer<typeof intensitySchema> | null;
  trailingConnector: z.infer<typeof trailingConnectorSchema> | null;
  composition: z.infer<typeof compositionSchema> | null;
  label: z.infer<typeof compositionLabelSchema> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const schemaSchema: z.ZodType<SchemaShape> = z.lazy(() =>
  z.object({
    id: z.string().cuid(),
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable(),
    alternatingGroupId: z.string().cuid().nullable(),
    order: z.number().int().positive(),
    kind: schemaKindSchema.nullable(),
    archetypeId: z.string().cuid().nullable(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
    archetypeParams: archetypeParamsSchema.nullable(),
    intensity: intensitySchema.nullable(),
    trailingConnector: trailingConnectorSchema.nullable(),
    composition: compositionSchema.nullable(),
    label: compositionLabelSchema.nullable(),
    notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type SchemaWithBody = {
  schema: z.infer<typeof schemaSchema>;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
};

export const schemaWithBodySchema: z.ZodType<SchemaWithBody> = z.lazy(() =>
  z.object({
    schema: schemaSchema,
    rows: z.array(schemaRowSchema),
    subSchemas: z.array(schemaWithBodySchema),
  }),
);

export const schemaSchemaWithInvariants = schemaSchema.superRefine((value, ctx) => {
  if (value.parentSchemaId !== null) {
    const allowed: readonly string[] = SUB_SCHEMA_ALLOWED_KINDS;

    if (value.kind !== null && !allowed.includes(value.kind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kind"],
        message: `sub-schema kind must be one of ${SUB_SCHEMA_ALLOWED_KINDS.join(", ")} when parentSchemaId is set`,
      });
    }
  }

  if (value.parentSchemaId !== null && value.alternatingGroupId !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["alternatingGroupId"],
      message: "alternatingGroupId is not allowed on sub-schemas (parentSchemaId is set)",
    });
  }
});

const ARCHETYPE_TRIAD_SIZE = 3;

const createSchemaBaseSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  kind: schemaKindSchema.optional(),
  archetypeId: z.string().cuid().optional(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  archetypeParams: archetypeParamsSchema.optional(),
  intensity: intensitySchema.nullable().optional(),
  trailingConnector: trailingConnectorSchema.nullable().optional(),
  composition: compositionSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const createSchemaSchema = createSchemaBaseSchema.superRefine((value, ctx) => {
  const presentCount = [value.kind, value.archetypeId, value.archetypeParams].filter(
    (field) => field !== undefined,
  ).length;

  if (presentCount === 0 || presentCount === ARCHETYPE_TRIAD_SIZE) {
    return;
  }

  if (value.kind === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["kind"],
      message: "kind, archetypeId and archetypeParams must be provided together or all omitted",
    });
  }

  if (value.archetypeId === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["archetypeId"],
      message: "kind, archetypeId and archetypeParams must be provided together or all omitted",
    });
  }

  if (value.archetypeParams === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["archetypeParams"],
      message: "kind, archetypeId and archetypeParams must be provided together or all omitted",
    });
  }
});

export const updateSchemaSchema = createSchemaBaseSchema.partial();

export const reorderSchemasSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
