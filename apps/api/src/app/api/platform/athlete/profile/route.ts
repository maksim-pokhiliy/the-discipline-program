import { NextResponse } from "next/server";

import { platformAthleteProfileApi } from "@repo/api-server";
import {
  getAthleteProfileResponseSchema,
  updateAthleteProfileRequestSchema,
  updateAthleteProfileResponseSchema,
} from "@repo/contracts/athlete-profile";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformAthleteProfileApi.get(userId);
  const validated = getAthleteProfileResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = updateAthleteProfileRequestSchema.parse(body);
  const result = await platformAthleteProfileApi.upsert(userId, data);
  const validated = updateAthleteProfileResponseSchema.parse(result);

  return NextResponse.json(validated);
});
