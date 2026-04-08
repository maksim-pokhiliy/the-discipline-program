import { NextResponse } from "next/server";

import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  createUserBenchmarkRequestSchema,
  createUserBenchmarkResponseSchema,
  getUserBenchmarksParamsSchema,
  getUserBenchmarksResponseSchema,
} from "@repo/contracts/user-benchmark";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, authUserId) => {
  const { userId } = getUserBenchmarksParamsSchema.parse(await context.params);
  const data = await platformUserBenchmarksApi.getByUser(authUserId, userId);
  const validated = getUserBenchmarksResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, context, authUserId) => {
  const { userId } = getUserBenchmarksParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = createUserBenchmarkRequestSchema.parse(body);
  const result = await platformUserBenchmarksApi.create(authUserId, userId, data);
  const validated = createUserBenchmarkResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
