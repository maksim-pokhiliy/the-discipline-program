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

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { noteId }) => coachingCoachNoteApi.getById(userId, noteId),
      getCoachNoteByIdParamsSchema,
      getCoachNoteByIdResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
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

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { noteId }) => coachingCoachNoteApi.delete(userId, noteId),
      deleteCoachNoteParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
