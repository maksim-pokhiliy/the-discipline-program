import { NextResponse } from "next/server";

import { platformBenchmarkDefinitionsApi } from "@repo/api-server";
import {
  deleteBenchmarkDefinitionParamsSchema,
  getBenchmarkDefinitionByIdParamsSchema,
  getBenchmarkDefinitionResponseSchema,
  updateBenchmarkDefinitionParamsSchema,
  updateBenchmarkDefinitionRequestSchema,
  updateBenchmarkDefinitionResponseSchema,
} from "@repo/contracts/benchmark-definition";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ definitionId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { definitionId } = getBenchmarkDefinitionByIdParamsSchema.parse(await context.params);
    const data = await platformBenchmarkDefinitionsApi.getById(definitionId);
    const validated = getBenchmarkDefinitionResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { definitionId } = updateBenchmarkDefinitionParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateBenchmarkDefinitionRequestSchema.parse(body);
    const result = await platformBenchmarkDefinitionsApi.update(definitionId, data);
    const validated = updateBenchmarkDefinitionResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { definitionId } = deleteBenchmarkDefinitionParamsSchema.parse(await context.params);

    await platformBenchmarkDefinitionsApi.delete(definitionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
