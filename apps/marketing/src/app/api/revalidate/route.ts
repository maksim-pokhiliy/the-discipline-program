import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { parseQuery, withPublicRoute } from "@repo/api-routes";
import { revalidateQuerySchema } from "@repo/contracts/cms/pages";
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
  const secret = new URL(request.url).searchParams.get("secret");

  if (!isSecretValid(secret, baseEnv.REVALIDATE_SECRET)) {
    throw new UnauthorizedError("Invalid revalidation token");
  }

  const target = parseQuery(revalidateQuerySchema, request);

  revalidatePath(target.path, target.type);

  return NextResponse.json({ revalidated: true, ...target });
};

export const GET = withPublicRoute(handler);
