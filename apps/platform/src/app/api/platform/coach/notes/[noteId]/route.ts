import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingCoachNoteApi } from "@repo/api-server/coaching";
import {
  deleteCoachNoteParamsSchema,
  getCoachNoteByIdParamsSchema,
  getCoachNoteByIdResponseSchema,
  updateCoachNoteParamsSchema,
  updateCoachNoteRequestSchema,
  updateCoachNoteResponseSchema,
} from "@repo/contracts/coaching/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { noteId }) => coachingCoachNoteApi.getById(userId, noteId),
      getCoachNoteByIdParamsSchema,
      getCoachNoteByIdResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withPlatformAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { noteId }, data) => coachingCoachNoteApi.update(userId, noteId, data),
      updateCoachNoteParamsSchema,
      updateCoachNoteRequestSchema,
      updateCoachNoteResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withPlatformAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { noteId }) => coachingCoachNoteApi.delete(userId, noteId),
      deleteCoachNoteParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
