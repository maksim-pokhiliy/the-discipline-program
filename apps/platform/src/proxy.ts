import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, getToken, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";

const ROLE_HOMES: Record<string, string> = {
  [UserRole.USER]: "/athlete",
  [UserRole.COACH]: "/coach",
};

const getRoleHome = (role?: string | null): string | null =>
  role ? (ROLE_HOMES[role] ?? null) : null;

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;
  const token = await getToken({ req });

  if (token && path === AUTH_ROUTES.LOGIN) {
    const home = getRoleHome(token.role);

    if (home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  if (!token && !isPublicRoute(path)) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  if (token && path === "/") {
    const home = getRoleHome(token.role);

    if (home) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  if (token && !isPublicRoute(path)) {
    const home = getRoleHome(token.role);

    if (!home) {
      return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
    }

    if (!path.startsWith(home)) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|icons|api).*)"],
};
