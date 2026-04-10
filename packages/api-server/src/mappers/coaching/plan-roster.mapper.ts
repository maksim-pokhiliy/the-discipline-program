import {
  type AthleteProfile,
  type PlanEnrollment as PrismaPlanEnrollment,
  type User,
} from "@prisma/client";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";

import { mapToPlanEnrollment } from "../lms/plan-enrollment.mapper";

import { HEALTH_STATUS_MAP } from "./enum-maps";

export type PlanRosterRow = PrismaPlanEnrollment & {
  user: Pick<User, "id" | "name" | "email" | "image"> & {
    athleteProfile: Pick<AthleteProfile, "healthStatus"> | null;
  };
};

export const mapToPlanRosterEntry = (row: PlanRosterRow): PlanRosterEntry => ({
  ...mapToPlanEnrollment(row),
  user: {
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    image: row.user.image,
    healthStatus: row.user.athleteProfile
      ? HEALTH_STATUS_MAP[row.user.athleteProfile.healthStatus]
      : HealthStatus.HEALTHY,
  },
});
