import { NextResponse } from "next/server";

import { platformCoachAthletesApi } from "@repo/api-server";
import { coachAthletesDataSchema } from "@repo/contracts/coach-athletes";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformCoachAthletesApi.getAthletes(userId);
  const validated = coachAthletesDataSchema.parse(data);

  return NextResponse.json(validated);
});
