import { NextResponse } from "next/server";

import { platformCoachNotesApi } from "@repo/api-server";
import {
  createCoachNoteRequestSchema,
  createCoachNoteResponseSchema,
  getCoachNotesResponseSchema,
} from "@repo/contracts/coach-note";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformCoachNotesApi.getAll(userId);
  const validated = getCoachNotesResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createCoachNoteRequestSchema.parse(body);
  const result = await platformCoachNotesApi.create(userId, data);
  const validated = createCoachNoteResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
