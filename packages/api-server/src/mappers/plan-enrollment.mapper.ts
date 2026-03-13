import { type PlanEnrollment as PrismaPlanEnrollment, type User } from "@prisma/client";

import { type PlanEnrollment } from "@repo/contracts/plan-enrollment";

type PlanEnrollmentWithUser = PrismaPlanEnrollment & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export const mapToPlanEnrollment = (e: PlanEnrollmentWithUser): PlanEnrollment => ({
  id: e.id,
  trainingPlanId: e.trainingPlanId,
  userId: e.userId,
  user: {
    id: e.user.id,
    name: e.user.name,
    email: e.user.email,
    image: e.user.image,
  },
  startDate: e.startDate,
  endDate: e.endDate,
  status: e.status as PlanEnrollment["status"],
  createdAt: e.createdAt,
});
