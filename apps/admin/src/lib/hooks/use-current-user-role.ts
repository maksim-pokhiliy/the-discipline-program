"use client";

import { useSession } from "@repo/auth/client";
import { type UserRole } from "@repo/contracts/iam/auth";

export const useCurrentUserRole = (): UserRole | null => {
  const { data: session } = useSession();

  return session?.user?.role ?? null;
};
