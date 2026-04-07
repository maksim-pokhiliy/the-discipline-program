import { NextResponse } from "next/server";

import { platformCoachProfileApi } from "@repo/api-server";
import {
  getCoachProfileResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coach-profile";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformCoachProfileApi.get(userId);
  const validated = getCoachProfileResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = updateCoachProfileRequestSchema.parse(body);
  const result = await platformCoachProfileApi.upsert(userId, data);
  const validated = updateCoachProfileResponseSchema.parse(result);

  return NextResponse.json(validated);
});
