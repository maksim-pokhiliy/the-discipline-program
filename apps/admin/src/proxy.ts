import { type NextRequest, NextResponse } from "next/server";

import { applyCspHeaders, createCspResponse, getMonitoring } from "@repo/api-routes";
import { AUTH_ROUTES, getToken, hasSessionCookie, isPublicRoute } from "@repo/auth";
import { UserRole } from "@repo/contracts/iam/auth";
import { logger } from "@repo/shared";

const redirectToLogin = (req: NextRequest, callbackPath?: string) => {
  const loginUrl = new URL(AUTH_ROUTES.LOGIN, req.url);

  if (callbackPath) {
    loginUrl.searchParams.set("callbackUrl", callbackPath);
  }

  return applyCspHeaders(req, NextResponse.redirect(loginUrl));
};

export const proxy = async (req: NextRequest) => {
  const path = req.nextUrl.pathname;
  const publicPath = isPublicRoute(path);

  if (!hasSessionCookie(req)) {
    return publicPath ? createCspResponse(req) : redirectToLogin(req, path);
  }

  let token: Awaited<ReturnType<typeof getToken>> = null;

  try {
    token = await getToken({ req });
  } catch (error) {
    logger.error("Proxy auth failed", {
      path,
      error: error instanceof Error ? error.message : String(error),
    });

    getMonitoring()?.captureException(error, {
      tags: { component: "proxy-auth", app: "admin" },
      level: "warning",
    });
  }

  if (!token) {
    return publicPath ? createCspResponse(req) : redirectToLogin(req, path);
  }

  const isAdminRole = token.role === UserRole.ADMIN || token.role === UserRole.HEAD_COACH;

  if (!isAdminRole) {
    return publicPath ? createCspResponse(req) : redirectToLogin(req);
  }

  if (path === AUTH_ROUTES.LOGIN) {
    return applyCspHeaders(req, NextResponse.redirect(new URL("/", req.url)));
  }

  return createCspResponse(req);
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons|api).*)"],
};
