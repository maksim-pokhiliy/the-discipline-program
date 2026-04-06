import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformCoachAthletesApi } from "@repo/api-server";
import { coachAthletesDataSchema } from "@repo/contracts/coach-athletes";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformCoachAthletesApi.getAthletes(userId);
  const validated = coachAthletesDataSchema.parse(data);

  return NextResponse.json(validated);
});
