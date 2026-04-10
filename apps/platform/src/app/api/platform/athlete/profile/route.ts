import { createAuthGetHandler, createAuthPutHandler } from "@repo/api-routes";
import { platformAthleteProfileApi } from "@repo/api-server";
import {
  getAthleteProfileResponseSchema,
  updateAthleteProfileRequestSchema,
  updateAthleteProfileResponseSchema,
} from "@repo/contracts/coaching/athlete-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformAthleteProfileApi.get(userId),
    getAthleteProfileResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutHandler(
    (userId, data) => platformAthleteProfileApi.upsert(userId, data),
    updateAthleteProfileRequestSchema,
    updateAthleteProfileResponseSchema,
  ),
);
