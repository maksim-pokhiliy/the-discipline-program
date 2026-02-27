import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformPrescribedSetsApi } from "@repo/api-server";
import {
  createPrescribedSetParamsSchema,
  createPrescribedSetRequestSchema,
  createPrescribedSetResponseSchema,
  getPrescribedSetsParamsSchema,
  getPrescribedSetsResponseSchema,
} from "@repo/contracts/prescribed-set";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { blockId } = getPrescribedSetsParamsSchema.parse(await context.params);
  const data = await platformPrescribedSetsApi.getAll(userId, blockId);
  const validated = getPrescribedSetsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, context, userId) => {
  const { blockId } = createPrescribedSetParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = createPrescribedSetRequestSchema.parse(body);
  const result = await platformPrescribedSetsApi.create(userId, blockId, data);
  const validated = createPrescribedSetResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
