import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, getToken, hasSessionCookie, isPublicRoute } from "@repo/auth";
import { ROLE_HOMES, UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

const PLATFORM_ROLE_HOMES: Record<string, string> = {
  [UserRole.ATHLETE]: ROLE_HOMES[UserRole.ATHLETE],
  [UserRole.COACH]: ROLE_HOMES[UserRole.COACH],
  [UserRole.HEAD_COACH]: ROLE_HOMES[UserRole.HEAD_COACH],
};

const getRoleHome = (role?: string | null): string | null =>
  role ? (PLATFORM_ROLE_HOMES[role] ?? null) : null;

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;
  const publicPath = isPublicRoute(path);

  if (!hasSessionCookie(req)) {
    if (publicPath) {
      return NextResponse.next();
    }

    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    loginUrl.searchParams.set("callbackUrl", path);

    return NextResponse.redirect(loginUrl);
  }

  let token: Awaited<ReturnType<typeof getToken>> = null;

  try {
    token = await getToken({ req });
  } catch (error) {
    logger.error("Proxy auth failed", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (token && path === AUTH_ROUTES.LOGIN) {
    const home = getRoleHome(token.role);

    if (home) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  if (!token && !publicPath) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    loginUrl.searchParams.set("callbackUrl", path);

    return NextResponse.redirect(loginUrl);
  }

  if (token && path === "/") {
    const home = getRoleHome(token.role);

    if (home) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  if (token && !publicPath) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons|api).*)"],
};
