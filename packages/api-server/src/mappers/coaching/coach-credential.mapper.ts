import { type CoachCredential as PrismaCoachCredential } from "@prisma/client";

import { type CoachCredential } from "@repo/contracts/coaching/coach-credential";

export const mapToCoachCredential = (c: PrismaCoachCredential): CoachCredential => ({
  id: c.id,
  coachProfileId: c.coachProfileId,
  title: c.title,
  issuer: c.issuer,
  year: c.year,
  shownToAthletes: c.shownToAthletes,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
