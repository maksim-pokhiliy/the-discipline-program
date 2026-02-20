import { NextResponse } from "next/server";

import { platformPrescribedSetsApi } from "@repo/api-server";
import {
  deletePrescribedSetParamsSchema,
  getPrescribedSetByIdParamsSchema,
  getPrescribedSetResponseSchema,
  updatePrescribedSetParamsSchema,
  updatePrescribedSetRequestSchema,
  updatePrescribedSetResponseSchema,
} from "@repo/contracts/prescribed-set";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { blockId, id } = getPrescribedSetByIdParamsSchema.parse(await context.params);
  const data = await platformPrescribedSetsApi.getById(userId, blockId, id);
  const validated = getPrescribedSetResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { blockId, id } = updatePrescribedSetParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updatePrescribedSetRequestSchema.parse(body);
  const result = await platformPrescribedSetsApi.update(userId, blockId, id, data);
  const validated = updatePrescribedSetResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { blockId, id } = deletePrescribedSetParamsSchema.parse(await context.params);

  await platformPrescribedSetsApi.delete(userId, blockId, id);

  return NextResponse.json({ success: true });
});
