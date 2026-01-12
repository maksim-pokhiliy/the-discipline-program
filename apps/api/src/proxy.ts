import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { env } from "@repo/env";

const allowedOrigins = [
  env.NEXT_PUBLIC_MARKETING_URL,
  env.NEXT_PUBLIC_ADMIN_URL,
  env.NODE_ENV === "development" ? "http://localhost:3000" : null,
].filter(Boolean) as string[];

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const preflightHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    if (origin && allowedOrigins.includes(origin)) {
      preflightHeaders["Access-Control-Allow-Origin"] = origin;
      preflightHeaders["Access-Control-Allow-Credentials"] = "true";
    }

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
