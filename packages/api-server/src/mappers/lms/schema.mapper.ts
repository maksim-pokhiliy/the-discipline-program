import { type Schema as PrismaSchema, type SchemaRow as PrismaSchemaRow } from "@prisma/client";

import { intensitySchema } from "@repo/contracts/lms/_shared";
import { compositionSchema, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { type Schema, type SchemaWithBody } from "@repo/contracts/lms/schema";

import { mapToSchemaRow } from "./schema-row.mapper";

export type PrismaSchemaWithRows = PrismaSchema & {
  rows: PrismaSchemaRow[];
};

export const mapToSchema = (s: PrismaSchema): Schema => {
  const composition = s.composition === null ? null : compositionSchema.parse(s.composition);

  return {
    id: s.id,
    blockId: s.blockId,
    groupId: s.groupId,
    order: s.order,
    header: s.header,
    intensity: s.intensity === null ? null : intensitySchema.parse(s.intensity),
    composition,
    label: composition === null ? null : deriveCompositionLabel(composition),
    notes: s.notes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

export const mapToSchemaWithBody = (s: PrismaSchemaWithRows): SchemaWithBody => ({
  schema: mapToSchema(s),
  rows: s.rows.map(mapToSchemaRow),
});

export const mapSchemas = (flat: PrismaSchemaWithRows[]): SchemaWithBody[] =>
  [...flat].sort((a, b) => a.order - b.order).map(mapToSchemaWithBody);
