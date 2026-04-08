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

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context) => {
  const { definitionId } = getBenchmarkDefinitionByIdParamsSchema.parse(await context.params);
  const data = await platformBenchmarkDefinitionsApi.getById(definitionId);
  const validated = getBenchmarkDefinitionResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { definitionId } = updateBenchmarkDefinitionParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateBenchmarkDefinitionRequestSchema.parse(body);
  const result = await platformBenchmarkDefinitionsApi.update(userId, definitionId, data);
  const validated = updateBenchmarkDefinitionResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { definitionId } = deleteBenchmarkDefinitionParamsSchema.parse(await context.params);

  await platformBenchmarkDefinitionsApi.delete(userId, definitionId);

  return NextResponse.json({ success: true });
});
