import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  coachPlansPageDataSchema,
  createTrainingPlanRequestSchema,
  createTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, _context, userId) => {
  const data = await platformTrainingPlansApi.getPageData(userId);
  const validated = coachPlansPageDataSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createTrainingPlanRequestSchema.parse(body);
  const result = await platformTrainingPlansApi.create(userId, data);
  const validated = createTrainingPlanResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
