import {
  type AthleteProfile as PrismaAthleteProfile,
  type CoachAthleteAssignment as PrismaCoachAthleteAssignment,
  type CoachProfile as PrismaCoachProfile,
  type User as PrismaUser,
} from "@prisma/client";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";

import { mapToCoachListItem } from "../iam";
import { mapToUser } from "../iam/user.mapper";

import { mapToAthleteProfile } from "./athlete-profile.mapper";
import { mapToCoachProfile } from "./coach-profile.mapper";

export type AdminUserViewAssignmentRow = PrismaCoachAthleteAssignment & {
  coach: PrismaCoachProfile & {
    user: Pick<PrismaUser, "id" | "name" | "email">;
  };
};

export type AdminUserViewRow = PrismaUser & {
  athleteProfile: PrismaAthleteProfile | null;
  coachProfile: PrismaCoachProfile | null;
  athleteAssignments?: AdminUserViewAssignmentRow[];
};

export const mapToAdminUserView = (u: AdminUserViewRow): AdminUserView => ({
  ...mapToUser(u),
  hasPassword: u.password !== null,
  athleteProfile: u.athleteProfile
    ? {
        ...mapToAthleteProfile(u.athleteProfile),
        assignedCoaches: (u.athleteAssignments ?? []).map((a) =>
          mapToCoachListItem({ ...a.coach, user: a.coach.user }),
        ),
      }
    : null,
  coachProfile: u.coachProfile ? mapToCoachProfile(u.coachProfile) : null,
});
