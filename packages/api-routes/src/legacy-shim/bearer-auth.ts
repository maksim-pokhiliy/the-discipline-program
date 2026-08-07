import { bindIdentity, releaseIdentity } from "../identity-binding";
import { withErrorHandling } from "../route-helpers";
import type { RouteHandler } from "../types";

import { readLegacyBearerToken } from "./read-bearer-token";
import { legacyShimDenied } from "./responses";
import type { LegacyShimHandler, LegacyShimResolver } from "./types";

export const createMobileBearerAuth =
  (resolve: LegacyShimResolver) =>
  (handler: LegacyShimHandler): RouteHandler =>
    withErrorHandling(async (request, context) => {
      const token = readLegacyBearerToken(request);

      if (token === null) {
        return legacyShimDenied();
      }

      const resolution = await resolve(token);

      if (resolution.kind === "denied") {
        return legacyShimDenied();
      }

      bindIdentity(resolution.identity.userId);

      try {
        return await handler(request, context, resolution.identity);
      } finally {
        releaseIdentity();
      }
    });
