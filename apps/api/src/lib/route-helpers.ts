import { NextResponse } from "next/server";
import { type ZodSchema, type ZodType, type ZodTypeDef } from "zod";

type RouteContext = { params: Promise<Record<string, string>> };
type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const createGetHandler = <TResponse>(
  apiFn: () => Promise<TResponse>,
  responseSchema?: ZodSchema,
) => {
  return async () => {
    const data = await apiFn();
    const validated = responseSchema ? responseSchema.parse(data) : data;

    return NextResponse.json(validated);
  };
};

export const createGetByIdHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
  responseSchema?: ZodSchema,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const data = await apiFn(id);
    const validated = responseSchema ? responseSchema.parse(data) : data;

    return NextResponse.json(validated);
  };
};

export const createPostHandler = <TRequest, TResponse>(
  apiFn: (data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request) => {
    const body = await request.json();
    const data = requestSchema.parse(body);
    const result = await apiFn(data);

    return NextResponse.json(result);
  };
};

export const createPutHandler = <TRequest, TResponse>(
  apiFn: (id: string, data: TRequest) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const body = await request.json();
    const data = requestSchema.parse(body);
    const result = await apiFn(id, data);

    return NextResponse.json(result);
  };
};

export const createDeleteHandler = (
  apiFn: (id: string) => Promise<void>,
  paramsSchema: ZodSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);

    await apiFn(id);

    return NextResponse.json({ success: true });
  };
};

export const createToggleHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ZodSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const result = await apiFn(id);

    return NextResponse.json(result);
  };
};
