import { type PerformedSession as PrismaPerformedSession } from "@prisma/client";

import { type PerformedSession } from "@repo/contracts/lms/performed-session";

export const mapToPerformedSession = (p: PrismaPerformedSession): PerformedSession => ({
  id: p.id,
  sessionId: p.sessionId,
  userId: p.userId,
  performedAt: p.performedAt,
  coachNotes: p.coachNotes,
  athleteNotes: p.athleteNotes,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
