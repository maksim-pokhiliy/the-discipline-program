import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { librarySchemeAdminApi } from "@repo/api-server/library";
import {
  deleteSchemeParamsSchema,
  getSchemeByIdParamsSchema,
  getSchemeResponseSchema,
  updateSchemeParamsSchema,
  updateSchemeRequestSchema,
  updateSchemeResponseSchema,
} from "@repo/contracts/library/scheme";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (_actorId, { id }) => librarySchemeAdminApi.getById(id),
      getSchemeByIdParamsSchema,
      getSchemeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (_actorId, { id }, data) => librarySchemeAdminApi.update({ id, input: data }),
      updateSchemeParamsSchema,
      updateSchemeRequestSchema,
      updateSchemeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (_actorId, { id }) => librarySchemeAdminApi.delete(id),
      deleteSchemeParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
