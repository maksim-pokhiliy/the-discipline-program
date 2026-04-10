import {
  type AthleteProfile as PrismaAthleteProfile,
  type CoachProfile as PrismaCoachProfile,
  type User as PrismaUser,
} from "@prisma/client";

import { type AdminUserView } from "@repo/contracts/coaching/admin-user-view";

import { mapToUser } from "../iam/user.mapper";

import { mapToAthleteProfile } from "./athlete-profile.mapper";
import { mapToCoachProfile } from "./coach-profile.mapper";

export type AdminUserViewRow = PrismaUser & {
  athleteProfile: PrismaAthleteProfile | null;
  coachProfile: PrismaCoachProfile | null;
};

export const mapToAdminUserView = (u: AdminUserViewRow): AdminUserView => ({
  ...mapToUser(u),
  athleteProfile: u.athleteProfile ? mapToAthleteProfile(u.athleteProfile) : null,
  coachProfile: u.coachProfile ? mapToCoachProfile(u.coachProfile) : null,
});
