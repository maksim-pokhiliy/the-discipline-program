import { NextResponse } from "next/server";
import { z } from "zod";

import { RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { type RouteContext } from "@repo/api-routes/types";
import { lmsPlanOverrideApi } from "@repo/api-server/lms";
import {
  effectivePlanWeekSchema,
  enrollmentOverrideParamSchema,
} from "@repo/contracts/lms/plan-override";
import { BadRequestError } from "@repo/errors";

import { withCoachAuth } from "@app/lib/server/auth";

const weekQuerySchema = z.object({
  week: z.coerce.number().int().nonnegative(),
});

export const GET = withCoachAuth(
  withAuthRateLimit(async (request: Request, context: RouteContext, userId: string) => {
    const { enrollmentId } = enrollmentOverrideParamSchema.parse(await context.params);
    const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parseResult = weekQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      throw new BadRequestError(
        "Missing or invalid 'week' query param — must be a non-negative integer",
      );
    }

    const { week: weekIndex } = parseResult.data;
    const result = await lmsPlanOverrideApi.getEffectivePlan(userId, enrollmentId, weekIndex);
    const validated = effectivePlanWeekSchema.parse(result);

    return NextResponse.json(validated);
  }, RATE_LIMIT_TIER.API),
);
