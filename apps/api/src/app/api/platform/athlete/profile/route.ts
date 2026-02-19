import { NextResponse } from "next/server";

import { platformAthleteProfileApi } from "@repo/api-server";
import {
  getAthleteProfileResponseSchema,
  updateAthleteProfileRequestSchema,
  updateAthleteProfileResponseSchema,
} from "@repo/contracts/athlete-profile";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    const userId = await getAuthenticatedUserId();
    const data = await platformAthleteProfileApi.get(userId);
    const validated = getAthleteProfileResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request) => {
  try {
    const userId = await getAuthenticatedUserId();
    const body = await request.json();
    const data = updateAthleteProfileRequestSchema.parse(body);
    const result = await platformAthleteProfileApi.upsert(userId, data);
    const validated = updateAthleteProfileResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};
