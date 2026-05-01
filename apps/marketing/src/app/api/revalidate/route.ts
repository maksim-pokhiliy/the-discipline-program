import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { baseEnv } from "@repo/env/base";
import { UnauthorizedError } from "@repo/errors";

const isSecretValid = (provided: string | null, expected: string | undefined): boolean => {
  if (!expected || provided === null) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
};

const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path") ?? "/";

  if (!isSecretValid(secret, baseEnv.REVALIDATE_SECRET)) {
    throw new UnauthorizedError("Invalid revalidation token");
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
};

export const GET = withPublicRoute(handler);
