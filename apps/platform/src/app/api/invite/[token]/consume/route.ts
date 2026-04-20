import { NextResponse } from "next/server";

import {
  RATE_LIMIT_TIER,
  type RouteContext,
  withPublicRoute,
  withRateLimit,
} from "@repo/api-routes";
import { iamInviteTokenApi } from "@repo/api-server/iam";
import {
  consumeInviteParamsSchema,
  consumeInviteRequestSchema,
  consumeInviteResponseSchema,
} from "@repo/contracts/iam/invite-token";
import { BadRequestError } from "@repo/errors";

const parseRequestBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON in request body");
  }
};

const consumeInviteHandler = async (request: Request, context: RouteContext): Promise<Response> => {
  const { token } = consumeInviteParamsSchema.parse(await context.params);
  const body = await parseRequestBody(request);
  const { password } = consumeInviteRequestSchema.parse(body);
  const result = await iamInviteTokenApi.consume(token, password);
  const validated = consumeInviteResponseSchema.parse(result);

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(withRateLimit(consumeInviteHandler, RATE_LIMIT_TIER.AUTH));
