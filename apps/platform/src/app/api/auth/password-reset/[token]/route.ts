import {
  createGetByParamHandler,
  RATE_LIMIT_TIER,
  withPublicRoute,
  withRateLimit,
} from "@repo/api-routes";
import { iamPasswordResetApi } from "@repo/api-server/iam";
import {
  validatePasswordResetParamsSchema,
  validatePasswordResetResponseSchema,
} from "@repo/contracts/iam/password-reset";

export const GET = withPublicRoute(
  withRateLimit(
    createGetByParamHandler(
      ({ token }) => iamPasswordResetApi.validate(token),
      validatePasswordResetParamsSchema,
      validatePasswordResetResponseSchema,
    ),
    RATE_LIMIT_TIER.AUTH,
  ),
);
