import { type Prisma } from "@prisma/client";

export const enrolledInPlanWhere = (planId: string): Prisma.UserWhereInput => ({
  planEnrollmentsAsAthlete: { some: { planId, deletedAt: null } },
});
