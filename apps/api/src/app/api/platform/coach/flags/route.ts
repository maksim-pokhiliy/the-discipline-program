import { NextResponse } from "next/server";

import { platformAthleteFlagsApi } from "@repo/api-server";
import {
  createAthleteFlagRequestSchema,
  createAthleteFlagResponseSchema,
  getAthleteFlagsResponseSchema,
} from "@repo/contracts/athlete-flag";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformAthleteFlagsApi.getAll(userId);
  const validated = getAthleteFlagsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createAthleteFlagRequestSchema.parse(body);
  const result = await platformAthleteFlagsApi.create(userId, data);
  const validated = createAthleteFlagResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
