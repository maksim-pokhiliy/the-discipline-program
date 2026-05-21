import { z } from "zod";

import { connectorFormSchema, intensitySchema } from "../_shared";
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
  order: number;
  kind: z.infer<typeof schemaKindSchema>;
  archetypeId: string;
  header: string | null;
  archetypeParams: z.infer<typeof archetypeParamsSchema>;
  intensity: z.infer<typeof intensitySchema> | null;
  trailingConnector: z.infer<typeof trailingConnectorSchema> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const schemaSchema: z.ZodType<SchemaShape> = z.lazy(() =>
  z.object({
    id: z.string().cuid(),
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable(),
    order: z.number().int().positive(),
    kind: schemaKindSchema,
    archetypeId: z.string().cuid(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
    archetypeParams: archetypeParamsSchema,
    intensity: intensitySchema.nullable(),
    trailingConnector: trailingConnectorSchema.nullable(),
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

    if (!allowed.includes(value.kind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kind"],
        message: `sub-schema kind must be one of ${SUB_SCHEMA_ALLOWED_KINDS.join(", ")} when parentSchemaId is set`,
      });
    }
  }
});

export const createSchemaSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  kind: schemaKindSchema,
  archetypeId: z.string().cuid(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  archetypeParams: archetypeParamsSchema,
  intensity: intensitySchema.nullable().optional(),
  trailingConnector: trailingConnectorSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSchemaSchema = createSchemaSchema.partial();

export const reorderSchemasSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
