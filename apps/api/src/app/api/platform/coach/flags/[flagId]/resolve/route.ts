import { NextResponse } from "next/server";

import { platformAthleteFlagsApi } from "@repo/api-server";
import {
  resolveAthleteFlagParamsSchema,
  resolveAthleteFlagResponseSchema,
} from "@repo/contracts/athlete-flag";

import { withPlatformAuth } from "@app/lib/auth";

export const POST = withPlatformAuth(async (_, context, userId) => {
  const { flagId } = resolveAthleteFlagParamsSchema.parse(await context.params);
  const result = await platformAthleteFlagsApi.resolve(userId, flagId);
  const validated = resolveAthleteFlagResponseSchema.parse(result);

  return NextResponse.json(validated);
});
