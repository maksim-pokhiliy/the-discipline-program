import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformAthleteMaxesApi } from "@repo/api-server";
import {
  createAthleteMaxRequestSchema,
  createAthleteMaxResponseSchema,
  getAthleteMaxesResponseSchema,
} from "@repo/contracts/athlete-max";

export const GET = withPlatformAuth(async (request, _context, userId) => {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exerciseId") ?? undefined;
  const data = await platformAthleteMaxesApi.getAll(userId, exerciseId);
  const validated = getAthleteMaxesResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createAthleteMaxRequestSchema.parse(body);
  const result = await platformAthleteMaxesApi.create(userId, data);
  const validated = createAthleteMaxResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
