import { type Week as PrismaWeek } from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type Week } from "@repo/contracts/lms/week";

export const mapToWeek = (w: PrismaWeek): Week => ({
  id: w.id,
  planId: w.planId,
  startDate: w.startDate,
  notes: w.notes === null ? null : notesListSchema.parse(w.notes),
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
