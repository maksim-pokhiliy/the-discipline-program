import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { platformCoachNotesApi } from "@repo/api-server";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coach-note";

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
