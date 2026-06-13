import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Label as PrismaLabel,
  type SchemaGroup as PrismaSchemaGroup,
} from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type Block } from "@repo/contracts/lms/block";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { assertComposeTreeValid } from "./compose-projection.mapper";
import { mapToLabel } from "./label.mapper";
import { mapToSchemaGroup } from "./schema-group.mapper";
import { mapSchemas, type PrismaSchemaWithRows } from "./schema.mapper";

type BlockWithLabels = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

type BlockWithSchemas = BlockWithLabels & {
  schemas: PrismaSchemaWithRows[];
  groups: PrismaSchemaGroup[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  notes: b.notes === null ? null : notesListSchema.parse(b.notes),
  labels: [],
  schemas: [],
  groups: [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const mapToBlockWithLabels = (b: BlockWithLabels): Block => ({
  ...mapToBlock(b),
  labels: [...b.labelAssignments]
    .sort((a, x) => a.order - x.order)
    .map((la) => mapToLabel(la.label)),
});

const validateSchema = (schema: SchemaWithBody): SchemaWithBody => {
  assertComposeTreeValid(schema);

  return schema;
};

export const mapToBlockWithSchemas = (b: BlockWithSchemas): Block => ({
  ...mapToBlockWithLabels(b),
  schemas: mapSchemas(b.schemas).map(validateSchema),
  groups: b.groups.map(mapToSchemaGroup),
});
