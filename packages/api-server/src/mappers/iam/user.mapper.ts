import { type User as PrismaUser } from "@prisma/client";

import { type AdminUserListItem, type User } from "@repo/contracts/iam/user";

import { ROLE_MAP } from "./enum-maps";

export const mapToUser = (u: PrismaUser): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: ROLE_MAP[u.role],
  image: u.image,
  timezone: u.timezone,
  emailVerified: u.emailVerified,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
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
