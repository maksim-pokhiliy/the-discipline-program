import { type NextRequest, NextResponse } from "next/server";

import { getToken } from "@repo/auth";
import { AUTH_ROUTES, isPublicRoute } from "@repo/auth";

const getRoleHome = (role?: string | null): string => (role === "USER" ? "/athlete" : "/coach");

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });

  if (token && path === AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL(getRoleHome(token.role), req.url));
  }

  if (!token && !isPublicRoute(path)) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  if (token && path === "/") {
    return NextResponse.redirect(new URL(getRoleHome(token.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|icons).*)"],
};
