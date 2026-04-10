import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { platformCoachNotesApi } from "@repo/api-server/coaching";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coaching/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformCoachNotesApi.getAll(userId),
    getCoachNotesResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => platformCoachNotesApi.create(userId, data),
    createCoachNoteRequestSchema,
    createCoachNoteResponseSchema,
  ),
);
