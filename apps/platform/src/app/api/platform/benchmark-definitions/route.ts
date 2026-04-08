import { NextResponse } from "next/server";

import { platformBenchmarkDefinitionsApi } from "@repo/api-server";
import {
  createBenchmarkDefinitionRequestSchema,
  createBenchmarkDefinitionResponseSchema,
  getBenchmarkDefinitionsResponseSchema,
} from "@repo/contracts/benchmark-definition";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async () => {
  const data = await platformBenchmarkDefinitionsApi.getAll();
  const validated = getBenchmarkDefinitionsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, _context, userId) => {
  const body = await request.json();
  const data = createBenchmarkDefinitionRequestSchema.parse(body);
  const result = await platformBenchmarkDefinitionsApi.create(userId, data);
  const validated = createBenchmarkDefinitionResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
