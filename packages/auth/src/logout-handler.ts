import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, SESSION_COOKIES } from "./constants";

export const logoutHandler = (req: NextRequest) => {
  const response = NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));

  SESSION_COOKIES.forEach((name) => response.cookies.delete(name));

  return response;
};
