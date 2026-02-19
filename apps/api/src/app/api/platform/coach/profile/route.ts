import { NextResponse } from "next/server";

import { platformCoachProfileApi } from "@repo/api-server";
import {
  getCoachProfileResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coach-profile";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    const userId = await getAuthenticatedUserId();
    const data = await platformCoachProfileApi.get(userId);
    const validated = getCoachProfileResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request) => {
  try {
    const userId = await getAuthenticatedUserId();
    const body = await request.json();
    const data = updateCoachProfileRequestSchema.parse(body);
    const result = await platformCoachProfileApi.upsert(userId, data);
    const validated = updateCoachProfileResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};
