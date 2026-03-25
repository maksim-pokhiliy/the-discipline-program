import { NextResponse } from "next/server";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import {
  ProductToggleField,
  toggleProductParamsSchema,
  toggleProductQuerySchema,
} from "@repo/contracts/product";

const toggleHandlers: Record<ProductToggleField, (id: string) => Promise<unknown>> = {
  [ProductToggleField.IS_ACTIVE]: adminProductsApi.toggleStatus,
  [ProductToggleField.IS_FEATURED]: adminProductsApi.toggleFeatured,
};

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { id } = toggleProductParamsSchema.parse(await params);
  const { field } = toggleProductQuerySchema.parse({
    field: new URL(request.url).searchParams.get("field"),
  });

  return NextResponse.json(await toggleHandlers[field](id));
});
