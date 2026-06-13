import { type RowGroup as PrismaRowGroup, type Schema as PrismaSchema } from "@prisma/client";

import { intensitySchema, notesListSchema } from "@repo/contracts/lms/_shared";
import { compositionSchema, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import { type Schema, type SchemaWithBody } from "@repo/contracts/lms/schema";

import { mapToRowGroup } from "./row-group.mapper";
import { mapToSchemaRow, type PrismaSchemaRowWithModifiers } from "./schema-row.mapper";

export type PrismaSchemaWithRows = PrismaSchema & {
  rows: PrismaSchemaRowWithModifiers[];
  rowGroups: PrismaRowGroup[];
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
    notes: s.notes === null ? null : notesListSchema.parse(s.notes),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

export const mapToSchemaWithBody = (s: PrismaSchemaWithRows): SchemaWithBody => ({
  schema: mapToSchema(s),
  rows: s.rows.map(mapToSchemaRow),
  rowGroups: s.rowGroups.map(mapToRowGroup),
});

export const mapSchemas = (flat: PrismaSchemaWithRows[]): SchemaWithBody[] =>
  [...flat].sort((a, b) => a.order - b.order).map(mapToSchemaWithBody);
