import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot, type SessionWithLabel } from "@repo/contracts/lms/day";

import { mapToBlockWithLabels } from "./block.mapper";
import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type BlockWithLabelsRelation = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

type SessionWithRelations = PrismaSession & {
  label: PrismaLabel | null;
  blocks: BlockWithLabelsRelation[];
};

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: SessionWithRelations[];
};

export const mapToSessionWithLabelAndBlocks = (s: SessionWithRelations): SessionWithLabel => ({
  ...mapToSession(s),
  label: s.label ? mapToLabel(s.label) : null,
  blocks: s.blocks.map(mapToBlockWithLabels),
});

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map(mapToSessionWithLabelAndBlocks),
});
