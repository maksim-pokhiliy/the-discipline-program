import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Label as PrismaLabel,
} from "@prisma/client";

import { intensitySchema, timeCapSchema } from "@repo/contracts/lms/_shared";
import { type Block } from "@repo/contracts/lms/block";

import { mapToLabel } from "./label.mapper";

type BlockWithLabels = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  intensity: b.intensity === null ? null : intensitySchema.parse(b.intensity),
  timeCap: b.timeCap === null ? null : timeCapSchema.parse(b.timeCap),
  notes: b.notes,
  labels: [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const mapToBlockWithLabels = (b: BlockWithLabels): Block => ({
  ...mapToBlock(b),
  labels: [...b.labelAssignments]
    .sort((a, x) => a.order - x.order)
    .map((la) => mapToLabel(la.label)),
});
