import { NextResponse } from "next/server";
import { z } from "zod";

import { platformCoachAthletesApi } from "@repo/api-server";
import { coachAthleteDetailSchema } from "@repo/contracts/coach-athletes";

import { withPlatformAuth } from "@app/lib/auth";

const paramsSchema = z.object({ userId: z.string() });

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { userId: athleteUserId } = paramsSchema.parse(await context.params);
  const data = await platformCoachAthletesApi.getAthleteDetail(userId, athleteUserId);
  const validated = coachAthleteDetailSchema.parse(data);

  return NextResponse.json(validated);
});
