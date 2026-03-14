import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformUsersApi } from "@repo/api-server";

export const GET = withPlatformAuth(async (request, _context, userId) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const data = await platformUsersApi.search(userId, query);

  return NextResponse.json(data);
});
