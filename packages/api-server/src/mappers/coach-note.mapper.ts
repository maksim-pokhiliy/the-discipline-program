import { type CoachNote as PrismaCoachNote } from "@prisma/client";

import { type CoachNote } from "@repo/contracts/coach-note";

export const mapToCoachNote = (n: PrismaCoachNote): CoachNote => ({
  id: n.id,
  coachId: n.coachId,
  athleteId: n.athleteId,
  content: n.content,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});
