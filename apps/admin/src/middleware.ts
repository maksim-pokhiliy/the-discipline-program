import { AUTH_ROUTES, isPublicRoute } from "@repo/auth";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });

  if (token && path === AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!token && !isPublicRoute(path)) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|icons).*)"],
};
