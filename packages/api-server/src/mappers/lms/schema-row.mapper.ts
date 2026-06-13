import {
  type Modifier as PrismaModifier,
  type RowModifierAssignment as PrismaRowModifierAssignment,
  type SchemaRow as PrismaSchemaRow,
} from "@prisma/client";

import {
  loadSchema,
  mediaReferenceSchema,
  notesListSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  tempoModifierSchema,
} from "@repo/contracts/lms/_shared";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";

import { mapToModifier } from "./modifier.mapper";

export type PrismaSchemaRowWithModifiers = PrismaSchemaRow & {
  modifierAssignments: (PrismaRowModifierAssignment & { modifier: PrismaModifier })[];
};

export const mapToSchemaRow = (r: PrismaSchemaRowWithModifiers): SchemaRow => ({
  id: r.id,
  schemaId: r.schemaId,
  order: r.order,
  exerciseId: r.exerciseId,
  sets: r.sets,
  rowGroupId: r.rowGroupId,
  load: r.load === null ? null : loadSchema.parse(r.load),
  reps: r.reps === null ? null : repNotationSchema.parse(r.reps),
  side: r.side === null ? null : perLimbDistributionSchema.parse(r.side),
  tempo: r.tempo === null ? null : tempoModifierSchema.parse(r.tempo),
  media: r.media === null ? null : mediaReferenceSchema.parse(r.media),
  modifiers: [...r.modifierAssignments]
    .sort((a, b) => a.order - b.order)
    .map((a) => mapToModifier(a.modifier)),
  notes: r.notes === null ? null : notesListSchema.parse(r.notes),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
