import { NextResponse } from "next/server";

import { platformWorkoutLogsApi } from "@repo/api-server";
import {
  createWorkoutLogRequestSchema,
  createWorkoutLogResponseSchema,
  getWorkoutLogsResponseSchema,
} from "@repo/contracts/workout-log";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

export const GET = async () => {
  try {
    const userId = await getAuthenticatedUserId();
    const data = await platformWorkoutLogsApi.getAll(userId);
    const validated = getWorkoutLogsResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await getAuthenticatedUserId();
    const body = await request.json();
    const data = createWorkoutLogRequestSchema.parse(body);
    const result = await platformWorkoutLogsApi.create(userId, data);
    const validated = createWorkoutLogResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
