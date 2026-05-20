import { type SchemaRow as PrismaSchemaRow } from "@prisma/client";

import {
  compoundRepDefinitionSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  sequenceIndicatorSchema,
  tempoModifierSchema,
} from "@repo/contracts/lms/_shared";
import { type SchemaRow, schemaRowPayloadSchema } from "@repo/contracts/lms/schema-row";

export const mapToSchemaRow = (r: PrismaSchemaRow): SchemaRow => ({
  id: r.id,
  schemaId: r.schemaId,
  order: r.order,
  rowKind: r.rowKind,
  rowPayload: schemaRowPayloadSchema.parse(r.rowPayload),
  load: r.load === null ? null : loadSchema.parse(r.load),
  reps: r.reps === null ? null : repNotationSchema.parse(r.reps),
  side: r.side === null ? null : perLimbDistributionSchema.parse(r.side),
  tempo: r.tempo === null ? null : tempoModifierSchema.parse(r.tempo),
  position: r.position,
  sequence: r.sequence === null ? null : sequenceIndicatorSchema.parse(r.sequence),
  intensity: r.intensity === null ? null : intensitySchema.parse(r.intensity),
  media: r.media === null ? null : mediaReferenceSchema.parse(r.media),
  compoundRep: r.compoundRep === null ? null : compoundRepDefinitionSchema.parse(r.compoundRep),
  notes: r.notes,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
