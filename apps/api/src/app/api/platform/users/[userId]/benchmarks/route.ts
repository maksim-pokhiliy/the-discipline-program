import { NextResponse } from "next/server";

import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  createUserBenchmarkRequestSchema,
  createUserBenchmarkResponseSchema,
  getUserBenchmarksParamsSchema,
  getUserBenchmarksResponseSchema,
} from "@repo/contracts/user-benchmark";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ userId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { userId } = getUserBenchmarksParamsSchema.parse(await context.params);
    const data = await platformUserBenchmarksApi.getByUser(userId);
    const validated = getUserBenchmarksResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { userId } = getUserBenchmarksParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = createUserBenchmarkRequestSchema.parse(body);
    const result = await platformUserBenchmarksApi.create(userId, data);
    const validated = createUserBenchmarkResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
