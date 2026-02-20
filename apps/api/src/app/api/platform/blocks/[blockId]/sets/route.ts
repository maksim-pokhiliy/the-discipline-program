import { NextResponse } from "next/server";

import { platformPrescribedSetsApi } from "@repo/api-server";
import {
  createPrescribedSetParamsSchema,
  createPrescribedSetRequestSchema,
  createPrescribedSetResponseSchema,
  getPrescribedSetsParamsSchema,
  getPrescribedSetsResponseSchema,
} from "@repo/contracts/prescribed-set";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

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
    const validated = createPrescribedSetResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
