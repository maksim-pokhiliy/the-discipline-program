"use client";

import { useSession } from "next-auth/react";

import { type UserRole } from "@repo/contracts/iam/auth";

export { getSession, signIn, signOut, useSession } from "next-auth/react";

export const useCurrentUserRole = (): UserRole | null => {
  const { data: session } = useSession();

  return session?.user?.role ?? null;
};

export const useCurrentUserId = (): string | null => {
  const { data: session } = useSession();

  return session?.user?.id ?? null;
};
