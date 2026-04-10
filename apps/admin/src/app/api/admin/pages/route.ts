import { z } from "zod";

import { createGetHandler } from "@repo/api-routes";
import { adminPagesApi } from "@repo/api-server/cms";
import { adminPageListItemSchema } from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminPagesApi.getPages, z.array(adminPageListItemSchema)),
);
