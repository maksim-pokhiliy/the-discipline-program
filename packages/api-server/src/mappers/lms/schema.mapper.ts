import { type Schema as PrismaSchema, type SchemaRow as PrismaSchemaRow } from "@prisma/client";

import { intensitySchema } from "@repo/contracts/lms/_shared";
import { compositionSchema, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import {
  archetypeParamsSchema,
  type Schema,
  type SchemaWithBody,
  trailingConnectorSchema,
} from "@repo/contracts/lms/schema";

import { mapToSchemaRow } from "./schema-row.mapper";

export type PrismaSchemaWithRows = PrismaSchema & {
  rows: PrismaSchemaRow[];
};

export type PrismaSchemaWithSubSchemas = PrismaSchemaWithRows & {
  subSchemas: PrismaSchemaWithRows[];
};

export const mapToSchema = (s: PrismaSchema): Schema => {
  const composition = s.composition === null ? null : compositionSchema.parse(s.composition);

  return {
    id: s.id,
    blockId: s.blockId,
    parentSchemaId: s.parentSchemaId,
    alternatingGroupId: s.alternatingGroupId,
    order: s.order,
    kind: s.kind,
    archetypeId: s.archetypeId,
    header: s.header,
    archetypeParams:
      s.archetypeParams === null ? null : archetypeParamsSchema.parse(s.archetypeParams),
    intensity: s.intensity === null ? null : intensitySchema.parse(s.intensity),
    trailingConnector:
      s.trailingConnector === null ? null : trailingConnectorSchema.parse(s.trailingConnector),
    composition,
    label: composition === null ? null : deriveCompositionLabel(composition),
    notes: s.notes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

export const buildSchemaWithBody = (s: PrismaSchemaWithSubSchemas): SchemaWithBody => ({
  schema: mapToSchema(s),
  rows: s.rows.map(mapToSchemaRow),
  subSchemas: s.subSchemas.map((sub) => ({
    schema: mapToSchema(sub),
    rows: sub.rows.map(mapToSchemaRow),
    subSchemas: [],
  })),
});
