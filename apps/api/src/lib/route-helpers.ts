import { NextResponse } from "next/server";
import { type ZodSchema, type ZodType, type ZodTypeDef } from "zod";

import { handleApiError } from "@repo/errors";

type RouteContext = { params: Promise<{ id: string }> };

// ZodSchema<T> constrains both _input and _output to T, which breaks for schemas
// with .default()/.optional() where input differs from output. ZodType<T, ZodTypeDef, unknown>
// only constrains the output type, allowing flexible input.
type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const createGetHandler = <TResponse>(
  apiFn: () => Promise<TResponse>,
  responseSchema?: ZodSchema,
) => {
  return async () => {
    try {
      const data = await apiFn();
      const validated = responseSchema ? responseSchema.parse(data) : data;

      return NextResponse.json(validated);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const createGetByIdHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
  responseSchema?: ZodSchema,
) => {
  return async (_: Request, context: RouteContext) => {
    try {
      const { id } = paramsSchema.parse(await context.params);
      const data = await apiFn(id);
      const validated = responseSchema ? responseSchema.parse(data) : data;

      return NextResponse.json(validated);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const createPostHandler = <TRequest, TResponse>(
  apiFn: (data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const data = requestSchema.parse(body);
      const result = await apiFn(data);

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const createPutHandler = <TRequest, TResponse>(
  apiFn: (id: string, data: TRequest) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request, context: RouteContext) => {
    try {
      const { id } = paramsSchema.parse(await context.params);
      const body = await request.json();
      const data = requestSchema.parse(body);
      const result = await apiFn(id, data);

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const createDeleteHandler = (
  apiFn: (id: string) => Promise<void>,
  paramsSchema: ZodSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    try {
      const { id } = paramsSchema.parse(await context.params);

      await apiFn(id);

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  };
};

export const createToggleHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    try {
      const { id } = paramsSchema.parse(await context.params);
      const result = await apiFn(id);

      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
};
