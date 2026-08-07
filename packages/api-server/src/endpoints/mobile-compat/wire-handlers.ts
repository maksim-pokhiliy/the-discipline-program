import {
  legacyShimOk,
  readLegacyJsonBody,
  renderLegacyShimOutcome,
} from "@repo/api-routes/legacy-shim";
import type { RouteHandler } from "@repo/api-routes/types";

import type { MobileCompatApi } from "./create-mobile-compat-api";
import { legacySigninRequestSchema } from "./wire-schemas";

export type MobileCompatRoutes = {
  signin: RouteHandler;
  trainingLevels: RouteHandler;
  userPlans: RouteHandler;
};

const JSON_CONTENT_TYPE = "application/json";

const DENIED = { kind: "denied" } as const;

const isJsonRequest = (request: Request): boolean =>
  (request.headers.get("content-type") ?? "").includes(JSON_CONTENT_TYPE);

export const createMobileCompatRoutes = (api: MobileCompatApi): MobileCompatRoutes => ({
  signin: async (request) => {
    if (!isJsonRequest(request)) {
      return renderLegacyShimOutcome(DENIED);
    }

    const body = await readLegacyJsonBody(request);
    const parsed = legacySigninRequestSchema.safeParse(body);

    if (!parsed.success) {
      return renderLegacyShimOutcome(DENIED);
    }

    return renderLegacyShimOutcome(await api.signin(parsed.data));
  },

  trainingLevels: async () => legacyShimOk(api.listTrainingLevels()),

  userPlans: async () => legacyShimOk(api.listUserPlans()),
});
