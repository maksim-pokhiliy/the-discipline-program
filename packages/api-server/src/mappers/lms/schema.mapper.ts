import { type Schema as PrismaSchema } from "@prisma/client";

import { intensitySchema } from "@repo/contracts/lms/_shared";
import { compositionSchema, deriveCompositionLabel } from "@repo/contracts/lms/composition";
import {
  archetypeParamsSchema,
  type Schema,
  trailingConnectorSchema,
} from "@repo/contracts/lms/schema";

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
    archetypeParams: archetypeParamsSchema.parse(s.archetypeParams),
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
