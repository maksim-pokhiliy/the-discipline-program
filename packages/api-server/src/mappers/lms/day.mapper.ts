import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Schema as PrismaSchema,
  type SchemaRow as PrismaSchemaRow,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot, type SessionWithLabel } from "@repo/contracts/lms/day";

import { mapToBlockWithSchemas } from "./block.mapper";
import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type SchemaWithRowsRelation = PrismaSchema & {
  rows: PrismaSchemaRow[];
};

type BlockWithSchemasRelation = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
  schemas: SchemaWithRowsRelation[];
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
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map(mapToSessionWithLabelAndBlocks),
});
