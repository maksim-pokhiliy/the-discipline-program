import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  deleteUserBenchmarkParamsSchema,
  updateUserBenchmarkParamsSchema,
  updateUserBenchmarkRequestSchema,
  updateUserBenchmarkResponseSchema,
} from "@repo/contracts/user-benchmark";

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { benchmarkId } = updateUserBenchmarkParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateUserBenchmarkRequestSchema.parse(body);
  const result = await platformUserBenchmarksApi.update(userId, benchmarkId, data);
  const validated = updateUserBenchmarkResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { benchmarkId } = deleteUserBenchmarkParamsSchema.parse(await context.params);

  await platformUserBenchmarksApi.delete(userId, benchmarkId);

  return NextResponse.json({ success: true });
});
