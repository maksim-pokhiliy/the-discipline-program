import { createAuthGetHandler, createAuthPutHandler } from "@repo/api-routes";
import { coachingCoachProfileApi } from "@repo/api-server/coaching";
import {
  getCoachProfileResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coaching/coach-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => coachingCoachProfileApi.get(userId),
    getCoachProfileResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutHandler(
    (userId, data) => coachingCoachProfileApi.upsert(userId, data),
    updateCoachProfileRequestSchema,
    updateCoachProfileResponseSchema,
  ),
);
