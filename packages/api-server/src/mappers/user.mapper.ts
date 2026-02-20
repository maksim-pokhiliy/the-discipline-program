import {
  type AthleteProfile as PrismaAthleteProfile,
  type CoachProfile as PrismaCoachProfile,
  type User as PrismaUser,
} from "@prisma/client";

import { type AthleteProfile } from "@repo/contracts/athlete-profile";
import { type CoachProfile } from "@repo/contracts/coach-profile";
import { type AdminUser, type AdminUserListItem } from "@repo/contracts/user";

export const mapToAthleteProfile = (p: PrismaAthleteProfile): AthleteProfile => ({
  id: p.id,
  userId: p.userId,
  gender: p.gender,
  heightCm: p.heightCm,
  weightKg: p.weightKg ? Number(p.weightKg) : null,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const mapToCoachProfile = (p: PrismaCoachProfile): CoachProfile => ({
  id: p.id,
  userId: p.userId,
  bio: p.bio,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

type UserWithProfiles = PrismaUser & {
  athleteProfile: PrismaAthleteProfile | null;
  coachProfile: PrismaCoachProfile | null;
};

export const mapToAdminUser = (u: UserWithProfiles): AdminUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  image: u.image,
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
  role: u.role,
  image: u.image,
  createdAt: u.createdAt,
});
