import { NextResponse } from "next/server";

import { platformWorkoutLogsApi } from "@repo/api-server";
import {
  deleteWorkoutLogParamsSchema,
  getWorkoutLogByIdParamsSchema,
  getWorkoutLogResponseSchema,
} from "@repo/contracts/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { id } = getWorkoutLogByIdParamsSchema.parse(await context.params);
  const data = await platformWorkoutLogsApi.getById(userId, id);
  const validated = getWorkoutLogResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { id } = deleteWorkoutLogParamsSchema.parse(await context.params);

  await platformWorkoutLogsApi.delete(userId, id);

  return NextResponse.json({ success: true });
});
