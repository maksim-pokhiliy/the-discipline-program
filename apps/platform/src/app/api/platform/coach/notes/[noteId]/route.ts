import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
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
  createAuthGetByParamHandler(
    (userId, { noteId }) => coachingCoachNoteApi.getById(userId, noteId),
    getCoachNoteByIdParamsSchema,
    getCoachNoteByIdResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { noteId }, data) => coachingCoachNoteApi.update(userId, noteId, data),
    updateCoachNoteParamsSchema,
    updateCoachNoteRequestSchema,
    updateCoachNoteResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { noteId }) => coachingCoachNoteApi.delete(userId, noteId),
    deleteCoachNoteParamsSchema,
  ),
);
