import { NextResponse } from "next/server";

import { AUTH_ROUTES, SESSION_COOKIES } from "./constants";

type LogoutDeps = {
  getSession: () => Promise<{ user: { id: string } } | null>;
  incrementTokenVersion: (userId: string) => Promise<void>;
};

export type LogoutHandler = (request: Request) => Promise<Response>;

export const createLogoutHandler = ({
  getSession,
  incrementTokenVersion,
}: LogoutDeps): LogoutHandler => {
  return async (request) => {
    const session = await getSession();

    if (session?.user?.id) {
      await incrementTokenVersion(session.user.id);
    }

    const response = NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, request.url));

    for (const name of SESSION_COOKIES) {
      response.cookies.delete(name);
    }

    return response;
  };
};
