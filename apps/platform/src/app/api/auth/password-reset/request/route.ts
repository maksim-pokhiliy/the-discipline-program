import { NextResponse } from "next/server";

import { RATE_LIMIT_TIER, withPublicRoute, withRateLimit } from "@repo/api-routes";
import { iamPasswordResetApi } from "@repo/api-server/iam";
import {
  requestPasswordResetRequestSchema,
  requestPasswordResetResponseSchema,
} from "@repo/contracts/iam/password-reset";
import { BadRequestError } from "@repo/errors";

const parseRequestBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON in request body");
  }
};

const requestPasswordResetHandler = async (request: Request): Promise<Response> => {
  const body = await parseRequestBody(request);
  const input = requestPasswordResetRequestSchema.parse(body);

  await iamPasswordResetApi.request(input.email);
  const validated = requestPasswordResetResponseSchema.parse({ success: true });

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(
  withRateLimit(requestPasswordResetHandler, RATE_LIMIT_TIER.AUTH),
);
