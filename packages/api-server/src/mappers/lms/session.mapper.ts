import { type Session as PrismaSession } from "@prisma/client";

import { type Session } from "@repo/contracts/lms/session";

export const mapToSession = (s: PrismaSession): Session => ({
  id: s.id,
  dayId: s.dayId,
  order: s.order,
  labelId: s.labelId,
  notes: s.notes,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
