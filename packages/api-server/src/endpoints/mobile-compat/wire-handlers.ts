import {
  type LegacyShimHandler,
  legacyShimOk,
  readLegacyJsonBody,
  renderLegacyShimOutcome,
  renderLegacyUserOutcome,
} from "@repo/api-routes/legacy-shim";
import type { RouteHandler } from "@repo/api-routes/types";

import type { MobileCompatApi } from "./create-mobile-compat-api";
import {
  changePasswordRequestSchema,
  legacySigninRequestSchema,
  updateUserRequestSchema,
  userIdParamSchema,
} from "./wire-schemas";

export type MobileCompatRoutes = {
  signin: RouteHandler;
  trainingLevels: RouteHandler;
  userPlans: RouteHandler;
  getUser: LegacyShimHandler;
  updateUser: LegacyShimHandler;
  changePassword: LegacyShimHandler;
};

const JSON_CONTENT_TYPE = "application/json";

const DENIED = { kind: "denied" } as const;

const isJsonRequest = (request: Request): boolean => {
  const mediaType = (request.headers.get("content-type") ?? "").split(";")[0] ?? "";

  return mediaType.trim().toLowerCase() === JSON_CONTENT_TYPE;
};

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

  getUser: async (_request, context, identity) => {
    const parsed = userIdParamSchema.safeParse(await context.params);

    if (!parsed.success) {
      return renderLegacyUserOutcome({ kind: "not-found" });
    }

    return renderLegacyUserOutcome(await api.getUser(identity, parsed.data.id));
  },

  updateUser: async (request, _context, identity) => {
    const parsed = updateUserRequestSchema.safeParse(await readLegacyJsonBody(request));

    if (!parsed.success) {
      return renderLegacyUserOutcome({ kind: "bad-request" });
    }

    return renderLegacyUserOutcome(await api.updateUser(identity, parsed.data));
  },

  changePassword: async (request, _context, identity) => {
    const parsed = changePasswordRequestSchema.safeParse(await readLegacyJsonBody(request));

    if (!parsed.success) {
      return renderLegacyUserOutcome({ kind: "bad-request" });
    }

    return renderLegacyUserOutcome(await api.changePassword(identity, parsed.data));
  },
});
