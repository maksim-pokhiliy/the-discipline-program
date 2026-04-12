import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, getToken, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });

  if (token && token.role === UserRole.ADMIN && path === AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!token && !isPublicRoute(path)) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  if (token && token.role !== UserRole.ADMIN && !isPublicRoute(path)) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|icons|api).*)"],
};
