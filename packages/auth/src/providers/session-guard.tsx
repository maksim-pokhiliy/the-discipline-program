"use client";

import { signOut, useSession } from "next-auth/react";

import { AUTH_ROUTES } from "../constants";

type SessionGuardProps = {
  children: React.ReactNode;
};

export const SessionGuard = ({ children }: SessionGuardProps) => {
  const { status } = useSession({
    required: true,
    onUnauthenticated: () =>
      signOut({ callbackUrl: `${window.location.origin}${AUTH_ROUTES.LOGIN}` }),
  });

  if (status === "loading") {
    return null;
  }

  return children;
};
