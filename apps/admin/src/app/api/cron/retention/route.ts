import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { runRetentionSweep } from "@repo/api-server/retention";
import { baseEnv } from "@repo/env/base";
import { UnauthorizedError } from "@repo/errors";

const BEARER_PREFIX = "Bearer ";

const isAuthorized = (header: string | null, expected: string | undefined): boolean => {
  if (!expected || header === null || !header.startsWith(BEARER_PREFIX)) {
    return false;
  }

  const provided = header.slice(BEARER_PREFIX.length);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
};

const handler = async (request: Request) => {
  if (!isAuthorized(request.headers.get("authorization"), baseEnv.CRON_SECRET)) {
    throw new UnauthorizedError("Invalid cron secret");
  }

  const result = await runRetentionSweep();

  return NextResponse.json(result);
};

export const GET = withPublicRoute(handler);
