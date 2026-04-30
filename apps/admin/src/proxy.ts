import { type NextRequest, NextResponse } from "next/server";

import { applyCspHeaders, createCspResponse } from "@repo/api-routes";
import { AUTH_ROUTES, getToken, hasSessionCookie, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;
  const publicPath = isPublicRoute(path);

  if (!hasSessionCookie(req)) {
    if (publicPath) {
      return createCspResponse(req);
    }

    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    loginUrl.searchParams.set("callbackUrl", path);

    return applyCspHeaders(req, NextResponse.redirect(loginUrl));
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

  const isAdminRole = token?.role === UserRole.ADMIN || token?.role === UserRole.HEAD_COACH;

  if (token && isAdminRole && path === AUTH_ROUTES.LOGIN) {
    return applyCspHeaders(req, NextResponse.redirect(new URL("/", req.url)));
  }

  if (!token && !publicPath) {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

    loginUrl.searchParams.set("callbackUrl", path);

    return applyCspHeaders(req, NextResponse.redirect(loginUrl));
  }

  if (token && !isAdminRole && !publicPath) {
    return applyCspHeaders(req, NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url)));
  }

  return createCspResponse(req);
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons|api).*)"],
};
