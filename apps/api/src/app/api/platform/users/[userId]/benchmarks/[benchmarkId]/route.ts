import { NextResponse } from "next/server";

import { platformUserBenchmarksApi } from "@repo/api-server";
import {
  deleteUserBenchmarkParamsSchema,
  updateUserBenchmarkParamsSchema,
  updateUserBenchmarkRequestSchema,
  updateUserBenchmarkResponseSchema,
} from "@repo/contracts/user-benchmark";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ userId: string; benchmarkId: string }> };

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { benchmarkId } = updateUserBenchmarkParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateUserBenchmarkRequestSchema.parse(body);
    const result = await platformUserBenchmarksApi.update(userId, benchmarkId, data);
    const validated = updateUserBenchmarkResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { benchmarkId } = deleteUserBenchmarkParamsSchema.parse(await context.params);

    await platformUserBenchmarksApi.delete(userId, benchmarkId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
