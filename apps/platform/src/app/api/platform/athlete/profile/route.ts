import { createAuthGetHandler, createAuthPutHandler } from "@repo/api-routes";
import { coachingAthleteProfileApi } from "@repo/api-server/coaching";
import {
  getAthleteProfileResponseSchema,
  updateAthleteProfileRequestSchema,
  updateAthleteProfileResponseSchema,
} from "@repo/contracts/coaching/athlete-profile";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => coachingAthleteProfileApi.get(userId),
    getAthleteProfileResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutHandler(
    (userId, data) => coachingAthleteProfileApi.upsert(userId, data),
    updateAthleteProfileRequestSchema,
    updateAthleteProfileResponseSchema,
  ),
);
