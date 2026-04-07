import { NextResponse } from "next/server";

import { platformWorkoutLogsApi } from "@repo/api-server";
import {
  createWorkoutLogRequestSchema,
  createWorkoutLogResponseSchema,
  getWorkoutLogsResponseSchema,
} from "@repo/contracts/workout-log";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformWorkoutLogsApi.getAll(userId);
  const validated = getWorkoutLogsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createWorkoutLogRequestSchema.parse(body);
  const result = await platformWorkoutLogsApi.create(userId, data);
  const validated = createWorkoutLogResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
