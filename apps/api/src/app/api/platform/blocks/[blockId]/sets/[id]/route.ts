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

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ blockId: string; id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { blockId, id } = getPrescribedSetByIdParamsSchema.parse(await context.params);
    const data = await platformPrescribedSetsApi.getById(userId, blockId, id);
    const validated = getPrescribedSetResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { blockId, id } = updatePrescribedSetParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updatePrescribedSetRequestSchema.parse(body);
    const result = await platformPrescribedSetsApi.update(userId, blockId, id, data);
    const validated = updatePrescribedSetResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { blockId, id } = deletePrescribedSetParamsSchema.parse(await context.params);

    await platformPrescribedSetsApi.delete(userId, blockId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
