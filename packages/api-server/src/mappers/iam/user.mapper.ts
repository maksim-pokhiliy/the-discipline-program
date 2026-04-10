import {
  type AthleteProfile as PrismaAthleteProfile,
  type CoachProfile as PrismaCoachProfile,
  type User as PrismaUser,
} from "@prisma/client";

import { type AdminUser, type AdminUserListItem } from "@repo/contracts/iam/user";

import { mapToAthleteProfile } from "../coaching/athlete-profile.mapper";
import { mapToCoachProfile } from "../coaching/coach-profile.mapper";

import { ROLE_MAP } from "./enum-maps";

type UserWithProfiles = PrismaUser & {
  athleteProfile: PrismaAthleteProfile | null;
  coachProfile: PrismaCoachProfile | null;
};

export const mapToAdminUser = (u: UserWithProfiles): AdminUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: ROLE_MAP[u.role],
  image: u.image,
  timezone: u.timezone,
  emailVerified: u.emailVerified,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  athleteProfile: u.athleteProfile ? mapToAthleteProfile(u.athleteProfile) : null,
  coachProfile: u.coachProfile ? mapToCoachProfile(u.coachProfile) : null,
});

export const mapToAdminUserListItem = (u: PrismaUser): AdminUserListItem => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: ROLE_MAP[u.role],
  image: u.image,
  timezone: u.timezone,
  createdAt: u.createdAt,
});
