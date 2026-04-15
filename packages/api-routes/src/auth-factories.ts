import { NextResponse } from "next/server";
import { type ZodType, type ZodTypeDef } from "zod";

import { parseJsonBody } from "./route-helpers";
import type { AuthenticatedHandler } from "./types";

type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const createAuthGetHandler = <TResponse>(
  apiFn: (userId: string) => Promise<TResponse>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (_request, _context, userId) => {
    const data = await apiFn(userId);
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createAuthGetWithQueryHandler = <TQuery, TResponse>(
  apiFn: (userId: string, query: TQuery) => Promise<TResponse>,
  querySchema: ParseSchema<TQuery>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (request, _context, userId) => {
    const queryParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = querySchema.parse(queryParams);
    const data = await apiFn(userId, query);
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createAuthGetByParamHandler = <TParams, TResponse>(
  apiFn: (userId: string, params: TParams) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (_request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const data = await apiFn(userId, params);
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createAuthPostHandler = <TRequest, TResponse>(
  apiFn: (userId: string, data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (request, _context, userId) => {
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  };
};

export const createAuthPostByParamHandler = <TParams, TRequest, TResponse>(
  apiFn: (userId: string, params: TParams, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, params, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  };
};

export const createAuthPutHandler = <TRequest, TResponse>(
  apiFn: (userId: string, data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (request, _context, userId) => {
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };
};

export const createAuthPutByParamHandler = <TParams, TRequest, TResponse>(
  apiFn: (userId: string, params: TParams, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  return async (request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, params, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };
};

export const createAuthVoidPutByParamHandler = <TParams, TRequest>(
  apiFn: (userId: string, params: TParams, data: TRequest) => Promise<void>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
): AuthenticatedHandler => {
  return async (request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);

    await apiFn(userId, params, data);

    return new NextResponse(null, { status: 204 });
  };
};

export const createAuthDeleteHandler = <TParams>(
  apiFn: (userId: string, params: TParams) => Promise<void>,
  paramsSchema: ParseSchema<TParams>,
): AuthenticatedHandler => {
  return async (_request, context, userId) => {
    const params = paramsSchema.parse(await context.params);

    await apiFn(userId, params);

    return new NextResponse(null, { status: 204 });
  };
};

export const createAuthActionHandler = <TParams, TResponse>(
  apiFn: (userId: string, params: TParams) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  responseSchema: ParseSchema<TResponse>,
  status = 200,
): AuthenticatedHandler => {
  return async (_request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const result = await apiFn(userId, params);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, status !== 200 ? { status } : undefined);
  };
};
