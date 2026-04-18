import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, SESSION_COOKIES } from "./constants";

type LogoutDeps = {
  getSession: () => Promise<{ user: { id: string } } | null>;
  incrementTokenVersion: (userId: string) => Promise<void>;
};

export const createLogoutHandler = ({ getSession, incrementTokenVersion }: LogoutDeps) => {
  return async (req: NextRequest) => {
    const session = await getSession();

    if (session?.user?.id) {
      await incrementTokenVersion(session.user.id);
    }

    const response = NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));

    for (const name of SESSION_COOKIES) {
      response.cookies.delete(name);
    }

    return response;
  };
};
