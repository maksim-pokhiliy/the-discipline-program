import {
  createAuthGetHandler,
  createAuthPostHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachNoteApi } from "@repo/api-server/coaching";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coaching/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => coachingCoachNoteApi.getAll(userId),
      getCoachNotesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withPlatformAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => coachingCoachNoteApi.create(userId, data),
      createCoachNoteRequestSchema,
      createCoachNoteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
