import { NextResponse } from "next/server";

import { platformCoachAthletesApi } from "@repo/api-server";
import {
  coachAthleteDetailParamsSchema,
  coachAthleteDetailSchema,
} from "@repo/contracts/coach-athletes";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { userId: athleteUserId } = coachAthleteDetailParamsSchema.parse(await context.params);
  const data = await platformCoachAthletesApi.getAthleteDetail(userId, athleteUserId);
  const validated = coachAthleteDetailSchema.parse(data);

  return NextResponse.json(validated);
});
