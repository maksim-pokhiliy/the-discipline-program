import { NextResponse } from "next/server";

import {
  parseJsonBody,
  parseRequest,
  parseResponse,
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

const consumeInviteHandler = async (request: Request, context: RouteContext): Promise<Response> => {
  const { token } = parseRequest(consumeInviteParamsSchema, await context.params);
  const body = await parseJsonBody(request);
  const input = parseRequest(consumeInviteRequestSchema, body);
  const result = await iamInviteTokenApi.consume(token, {
    password: input.password,
    ...(input.timezone !== undefined && { timezone: input.timezone }),
  });
  const validated = parseResponse(consumeInviteResponseSchema, result);

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(withRateLimit(consumeInviteHandler, RATE_LIMIT_TIER.AUTH));
