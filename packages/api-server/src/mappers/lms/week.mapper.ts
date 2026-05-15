import { type Week as PrismaWeek } from "@prisma/client";

import { type Week } from "@repo/contracts/lms/week";

export const mapToWeek = (w: PrismaWeek): Week => ({
  id: w.id,
  planId: w.planId,
  startDate: w.startDate,
  notes: w.notes,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});
