import { NextResponse } from "next/server";

import { platformAthleteFlagsApi } from "@repo/api-server";
import {
  getAthleteFlagByIdParamsSchema,
  updateAthleteFlagParamsSchema,
  updateAthleteFlagRequestSchema,
  updateAthleteFlagResponseSchema,
  deleteAthleteFlagParamsSchema,
} from "@repo/contracts/athlete-flag";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { flagId } = getAthleteFlagByIdParamsSchema.parse(await context.params);
  const data = await platformAthleteFlagsApi.getById(userId, flagId);

  return NextResponse.json(data);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { flagId } = updateAthleteFlagParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateAthleteFlagRequestSchema.parse(body);
  const result = await platformAthleteFlagsApi.update(userId, flagId, data);
  const validated = updateAthleteFlagResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { flagId } = deleteAthleteFlagParamsSchema.parse(await context.params);

  await platformAthleteFlagsApi.delete(userId, flagId);

  return NextResponse.json({ success: true });
});
