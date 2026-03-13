import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformAthleteMaxesApi } from "@repo/api-server";
import {
  getAthleteMaxesForExercisesRequestSchema,
  getAthleteMaxesForExercisesResponseSchema,
} from "@repo/contracts/athlete-max";

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const { planId, exerciseIds } = getAthleteMaxesForExercisesRequestSchema.parse(body);
  const data = await platformAthleteMaxesApi.getForPlanExercises(userId, planId, exerciseIds);
  const validated = getAthleteMaxesForExercisesResponseSchema.parse(data);

  return NextResponse.json(validated);
});
