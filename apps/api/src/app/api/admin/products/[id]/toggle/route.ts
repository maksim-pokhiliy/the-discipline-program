import { adminProductsApi } from "@repo/api-server";
import { toggleProductStatusParamsSchema } from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/auth";
import { createToggleHandler } from "@app/lib/route-helpers";

export const PATCH = withAdminAuth(
  createToggleHandler(adminProductsApi.toggleStatus, toggleProductStatusParamsSchema),
);
