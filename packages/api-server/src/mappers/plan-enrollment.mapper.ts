import {
  type AthleteProfile,
  type PlanEnrollment as PrismaPlanEnrollment,
  type User,
} from "@prisma/client";

import { HealthStatus } from "@repo/contracts/athlete-profile";
import { type PlanEnrollment } from "@repo/contracts/plan-enrollment";

import { HEALTH_STATUS_MAP, PLAN_ENROLLMENT_STATUS_MAP } from "./enum-maps";

type PlanEnrollmentWithData = PrismaPlanEnrollment & {
  user: Pick<User, "id" | "name" | "email" | "image"> & {
    athleteProfile: Pick<AthleteProfile, "healthStatus"> | null;
  };
};

export const mapToPlanEnrollment = (e: PlanEnrollmentWithData): PlanEnrollment => ({
  id: e.id,
  trainingPlanId: e.trainingPlanId,
  userId: e.userId,
  user: {
    id: e.user.id,
    name: e.user.name,
    email: e.user.email,
    image: e.user.image,
    healthStatus: e.user.athleteProfile
      ? HEALTH_STATUS_MAP[e.user.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY,
  },
  startDate: e.startDate,
  endDate: e.endDate,
  status: PLAN_ENROLLMENT_STATUS_MAP[e.status],
  createdAt: e.createdAt,
});
