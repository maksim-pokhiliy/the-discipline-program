import { NextResponse } from "next/server";

import { platformWorkoutLogsApi } from "@repo/api-server";
import {
  deleteWorkoutLogParamsSchema,
  getWorkoutLogByIdParamsSchema,
  getWorkoutLogResponseSchema,
} from "@repo/contracts/workout-log";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { id } = getWorkoutLogByIdParamsSchema.parse(await context.params);
    const data = await platformWorkoutLogsApi.getById(userId, id);
    const validated = getWorkoutLogResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { id } = deleteWorkoutLogParamsSchema.parse(await context.params);

    await platformWorkoutLogsApi.delete(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
