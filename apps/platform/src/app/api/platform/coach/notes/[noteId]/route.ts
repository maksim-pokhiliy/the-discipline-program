import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
import { platformCoachNotesApi } from "@repo/api-server";
import {
  deleteCoachNoteParamsSchema,
  getCoachNoteByIdParamsSchema,
  getCoachNoteByIdResponseSchema,
  updateCoachNoteParamsSchema,
  updateCoachNoteRequestSchema,
  updateCoachNoteResponseSchema,
} from "@repo/contracts/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { noteId }) => platformCoachNotesApi.getById(userId, noteId),
    getCoachNoteByIdParamsSchema,
    getCoachNoteByIdResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { noteId }, data) => platformCoachNotesApi.update(userId, noteId, data),
    updateCoachNoteParamsSchema,
    updateCoachNoteRequestSchema,
    updateCoachNoteResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { noteId }) => platformCoachNotesApi.delete(userId, noteId),
    deleteCoachNoteParamsSchema,
  ),
);
