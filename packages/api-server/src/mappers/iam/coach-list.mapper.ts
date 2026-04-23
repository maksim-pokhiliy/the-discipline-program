import type { CoachProfile as PrismaCoachProfile, User as PrismaUser } from "@prisma/client";

import type { CoachListItem } from "@repo/contracts/iam/user";

export type CoachListRow = PrismaCoachProfile & {
  user: Pick<PrismaUser, "id" | "name" | "email">;
};

export const mapToCoachListItem = (row: CoachListRow): CoachListItem => ({
  id: row.id,
  userId: row.user.id,
  name: row.user.name,
  email: row.user.email,
});
