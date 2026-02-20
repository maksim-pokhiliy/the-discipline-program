import { NextResponse } from "next/server";

import { platformBenchmarkDefinitionsApi } from "@repo/api-server";
import {
  createBenchmarkDefinitionRequestSchema,
  createBenchmarkDefinitionResponseSchema,
  getBenchmarkDefinitionsResponseSchema,
} from "@repo/contracts/benchmark-definition";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    await getAuthenticatedUserId();
    const data = await platformBenchmarkDefinitionsApi.getAll();
    const validated = getBenchmarkDefinitionsResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    await getAuthenticatedUserId();
    const body = await request.json();
    const data = createBenchmarkDefinitionRequestSchema.parse(body);
    const result = await platformBenchmarkDefinitionsApi.create(data);
    const validated = createBenchmarkDefinitionResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
