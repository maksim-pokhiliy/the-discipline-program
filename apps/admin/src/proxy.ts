import { type NextRequest, NextResponse } from "next/server";

import { AUTH_ROUTES, getToken, hasSessionCookie, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

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

  if (token && token.role === UserRole.ADMIN && path === AUTH_ROUTES.LOGIN) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!token && !publicPath) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    loginUrl.searchParams.set("callbackUrl", path);

    return NextResponse.redirect(loginUrl);
  }

  if (token && token.role !== UserRole.ADMIN && !publicPath) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons|api).*)"],
};
