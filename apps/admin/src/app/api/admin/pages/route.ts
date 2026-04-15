import { z } from "zod";

import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { adminPageListItemSchema } from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsPagesAdminApi.getPages, z.array(adminPageListItemSchema)),
    RATE_LIMIT_TIER.API,
  ),
);
