import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { coachingCoachNoteApi } from "@repo/api-server/coaching";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coaching/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => coachingCoachNoteApi.getAll(userId),
    getCoachNotesResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => coachingCoachNoteApi.create(userId, data),
    createCoachNoteRequestSchema,
    createCoachNoteResponseSchema,
  ),
);
