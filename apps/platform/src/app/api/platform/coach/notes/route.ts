import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachNoteApi } from "@repo/api-server/coaching";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesQuerySchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coaching/coach-note";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) => coachingCoachNoteApi.getAll(userId, query.athleteId),
      getCoachNotesQuerySchema,
      getCoachNotesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => coachingCoachNoteApi.create(userId, data),
      createCoachNoteRequestSchema,
      createCoachNoteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
