import { NextResponse } from "next/server";

import { platformPrescribedSetsApi } from "@repo/api-server";
import {
  createPrescribedSetParamsSchema,
  createPrescribedSetRequestSchema,
  getPrescribedSetsParamsSchema,
  getPrescribedSetsResponseSchema,
} from "@repo/contracts/prescribed-set";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ blockId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { blockId } = getPrescribedSetsParamsSchema.parse(await context.params);
    const data = await platformPrescribedSetsApi.getAll(userId, blockId);
    const validated = getPrescribedSetsResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { blockId } = createPrescribedSetParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = createPrescribedSetRequestSchema.parse(body);
    const result = await platformPrescribedSetsApi.create(userId, blockId, data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
