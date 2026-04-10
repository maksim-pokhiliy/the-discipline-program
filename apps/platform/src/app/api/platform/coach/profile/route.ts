import { createAuthGetHandler, createAuthPutHandler } from "@repo/api-routes";
import { platformCoachProfileApi } from "@repo/api-server";
import {
  getCoachProfileResponseSchema,
  updateCoachProfileRequestSchema,
  updateCoachProfileResponseSchema,
} from "@repo/contracts/coaching/coach-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformCoachProfileApi.get(userId),
    getCoachProfileResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutHandler(
    (userId, data) => platformCoachProfileApi.upsert(userId, data),
    updateCoachProfileRequestSchema,
    updateCoachProfileResponseSchema,
  ),
);
