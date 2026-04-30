import { NextResponse } from "next/server";

import { RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsPlanStructureApi } from "@repo/api-server/lms";
import {
  getPlanStructureParamsSchema,
  getPlanStructureQuerySchema,
  getPlanStructureResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(async (request, context, userId) => {
    const params = getPlanStructureParamsSchema.parse(await context.params);
    const query = getPlanStructureQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const data = await lmsPlanStructureApi.getStructure(userId, params.planId, query);
    const validated = getPlanStructureResponseSchema.parse(data);

    return NextResponse.json(validated);
  }, RATE_LIMIT_TIER.API),
);
