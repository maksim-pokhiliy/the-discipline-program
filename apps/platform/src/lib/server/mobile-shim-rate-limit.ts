import { RATE_LIMIT_TIER } from "@repo/api-routes";
import type { CredentialsRateLimitConfig } from "@repo/api-routes";

export const MOBILE_SHIM_SIGNIN_RATE_LIMIT: CredentialsRateLimitConfig = {
  ipTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP,
  identifierTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT,
  identifierFields: ["username"],
  identifierParse: "json",
};
