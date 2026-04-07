"use client";

import { signOut, useSession } from "next-auth/react";

type SessionGuardProps = {
  children: React.ReactNode;
};

export const SessionGuard = ({ children }: SessionGuardProps) => {
  const { status } = useSession({
    required: true,
    onUnauthenticated: () => signOut({ callbackUrl: `${window.location.origin}/login` }),
  });

  if (status === "loading") {
    return null;
  }

  return children;
};
