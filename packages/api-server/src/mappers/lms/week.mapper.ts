import { type Prisma, type Week as PrismaWeek } from "@prisma/client";

import { notesListSchema } from "@repo/contracts/lms/_shared";
import { type PopulatedWeek, type Week } from "@repo/contracts/lms/week";

import { toUtcDateParam } from "../../utils/date-param";

type PopulatedWeekPayload = Prisma.WeekGetPayload<{
  include: { days: { include: { _count: { select: { sessions: true } } } } };
}>;

export const mapToWeek = (w: PrismaWeek): Week => ({
  id: w.id,
  planId: w.planId,
  startDate: w.startDate,
  notes: w.notes === null ? null : notesListSchema.parse(w.notes),
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

export const mapToPopulatedWeek = (w: PopulatedWeekPayload): PopulatedWeek => ({
  startDate: toUtcDateParam(w.startDate),
  sessionCount: w.days.reduce((sum, day) => sum + day._count.sessions, 0),
  dayCount: w.days.filter((day) => day._count.sessions > 0).length,
});
