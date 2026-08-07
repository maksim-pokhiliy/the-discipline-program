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

export const createMobileCompatRoutes = (api: MobileCompatApi): MobileCompatRoutes => ({
  signin: async (request) => {
    const body = await readLegacyJsonBody(request);
    const parsed = legacySigninRequestSchema.safeParse(body);

    if (!parsed.success) {
      return renderLegacyShimOutcome({ kind: "denied" });
    }

    return renderLegacyShimOutcome(await api.signin(parsed.data));
  },

  trainingLevels: async () => legacyShimOk(api.listTrainingLevels()),

  userPlans: async () => legacyShimOk(api.listUserPlans()),
});
