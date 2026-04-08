import { z } from "zod";

import { createGetHandler } from "@repo/api-routes";
import { adminPagesApi } from "@repo/api-server";
import { adminPageListItemSchema } from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/auth";

export const GET = withAdminAuth(
  createGetHandler(adminPagesApi.getPages, z.array(adminPageListItemSchema)),
);
