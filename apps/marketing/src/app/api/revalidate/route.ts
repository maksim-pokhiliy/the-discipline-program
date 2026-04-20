import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { baseEnv } from "@repo/env/base";
import { UnauthorizedError } from "@repo/errors";

const handler = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path") ?? "/";

  if (!baseEnv.REVALIDATE_SECRET || secret !== baseEnv.REVALIDATE_SECRET) {
    throw new UnauthorizedError("Invalid revalidation token");
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
};

export const GET = withPublicRoute(handler);
