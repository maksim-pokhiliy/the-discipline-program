import { type CoachProfile as PrismaCoachProfile } from "@prisma/client";

import { type CoachProfile } from "@repo/contracts/coaching/coach-profile";

export const mapToCoachProfile = (p: PrismaCoachProfile): CoachProfile => ({
  id: p.id,
  userId: p.userId,
  bio: p.bio,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});
