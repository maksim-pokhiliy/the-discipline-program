import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, getToken, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

const ROLE_HOMES: Record<string, string> = {
  [UserRole.USER]: "/athlete",
  [UserRole.COACH]: "/coach",
};

const getRoleHome = (role?: string | null): string | null =>
  role ? (ROLE_HOMES[role] ?? null) : null;

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;

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

  if (!token && !isPublicRoute(path)) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons|api).*)"],
};
