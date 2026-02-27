import { createToggleHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import { toggleProductStatusParamsSchema } from "@repo/contracts/product";

export const PATCH = withAdminAuth(
  createToggleHandler(adminProductsApi.toggleStatus, toggleProductStatusParamsSchema),
);
