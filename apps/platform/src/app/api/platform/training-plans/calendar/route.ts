import { createAuthGetWithQueryHandler } from "@repo/api-routes";
import { platformTrainingPlansApi } from "@repo/api-server";
import {
  getCalendarWeekParamsSchema,
  getCalendarWeekResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetWithQueryHandler(
    (userId, { weekStart }) => platformTrainingPlansApi.getCalendarWeek(userId, weekStart),
    getCalendarWeekParamsSchema,
    getCalendarWeekResponseSchema,
  ),
);
