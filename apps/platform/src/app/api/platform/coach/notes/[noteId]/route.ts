import { NextResponse } from "next/server";

import { platformCoachNotesApi } from "@repo/api-server";
import {
  getCoachNoteByIdParamsSchema,
  updateCoachNoteParamsSchema,
  updateCoachNoteRequestSchema,
  updateCoachNoteResponseSchema,
  deleteCoachNoteParamsSchema,
} from "@repo/contracts/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { noteId } = getCoachNoteByIdParamsSchema.parse(await context.params);
  const data = await platformCoachNotesApi.getById(userId, noteId);

  return NextResponse.json(data);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { noteId } = updateCoachNoteParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateCoachNoteRequestSchema.parse(body);
  const result = await platformCoachNotesApi.update(userId, noteId, data);
  const validated = updateCoachNoteResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { noteId } = deleteCoachNoteParamsSchema.parse(await context.params);

  await platformCoachNotesApi.delete(userId, noteId);

  return NextResponse.json({ success: true });
});
