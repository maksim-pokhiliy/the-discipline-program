import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Label as PrismaLabel,
} from "@prisma/client";

import { intensitySchema, timeCapSchema } from "@repo/contracts/lms/_shared";
import { type Block } from "@repo/contracts/lms/block";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { assertComposeTreeValid } from "./compose-projection.mapper";
import { mapToLabel } from "./label.mapper";
import { buildSchemaWithBody, type PrismaSchemaWithSubSchemas } from "./schema.mapper";

type BlockWithLabels = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

type BlockWithSchemas = BlockWithLabels & {
  schemas: PrismaSchemaWithSubSchemas[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  intensity: b.intensity === null ? null : intensitySchema.parse(b.intensity),
  timeCap: b.timeCap === null ? null : timeCapSchema.parse(b.timeCap),
  notes: b.notes,
  labels: [],
  schemas: [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const mapToBlockWithLabels = (b: BlockWithLabels): Block => ({
  ...mapToBlock(b),
  labels: [...b.labelAssignments]
    .sort((a, x) => a.order - x.order)
    .map((la) => mapToLabel(la.label)),
});

const buildValidatedSchemaWithBody = (s: PrismaSchemaWithSubSchemas): SchemaWithBody => {
  const schemaWithBody = buildSchemaWithBody(s);

  assertComposeTreeValid(schemaWithBody);

  return schemaWithBody;
};

export const mapToBlockWithSchemas = (b: BlockWithSchemas): Block => ({
  ...mapToBlockWithLabels(b),
  schemas: b.schemas.map(buildValidatedSchemaWithBody),
});
