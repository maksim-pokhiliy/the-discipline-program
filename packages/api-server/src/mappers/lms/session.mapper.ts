import { type Session as PrismaSession } from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type Session } from "@repo/contracts/lms/session";

export const mapToSession = (s: PrismaSession): Session => ({
  id: s.id,
  dayId: s.dayId,
  order: s.order,
  labelId: s.labelId,
  notes: s.notes === null ? null : notesListSchema.parse(s.notes),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
