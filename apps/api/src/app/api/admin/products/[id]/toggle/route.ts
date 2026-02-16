import { adminProductsApi } from "@repo/api-server";
import { toggleProductStatusParamsSchema } from "@repo/contracts/product";

import { createToggleHandler } from "@app/lib/route-helpers";

export const PATCH = createToggleHandler(
  adminProductsApi.toggleStatus,
  toggleProductStatusParamsSchema,
);
