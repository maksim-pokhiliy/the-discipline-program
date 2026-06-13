import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type SchemaGroup as PrismaSchemaGroup,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek, notesListSchema } from "@repo/contracts/lms/_shared";
import { type DaySlot, type SessionWithLabel } from "@repo/contracts/lms/day";

import { mapToBlockWithSchemas } from "./block.mapper";
import { mapToLabel } from "./label.mapper";
import { type PrismaSchemaWithRows } from "./schema.mapper";
import { mapToSession } from "./session.mapper";

type BlockWithSchemasRelation = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
  schemas: PrismaSchemaWithRows[];
  groups: PrismaSchemaGroup[];
};

type SessionWithRelations = PrismaSession & {
  label: PrismaLabel | null;
  blocks: BlockWithSchemasRelation[];
};

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: SessionWithRelations[];
};

export const mapToSessionWithLabelAndBlocks = (s: SessionWithRelations): SessionWithLabel => ({
  ...mapToSession(s),
  label: s.label ? mapToLabel(s.label) : null,
  blocks: s.blocks.map(mapToBlockWithSchemas),
});

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes == null ? null : notesListSchema.parse(day.notes),
  sessions: (day?.sessions ?? []).map(mapToSessionWithLabelAndBlocks),
});
