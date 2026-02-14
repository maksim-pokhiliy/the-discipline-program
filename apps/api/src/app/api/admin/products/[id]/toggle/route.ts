import { NextResponse } from "next/server";

import { adminProductsApi } from "@repo/api-server";
import { toggleProductStatusParamsSchema } from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleProductStatusParamsSchema.parse(await params);
    const product = await adminProductsApi.toggleStatus(id);

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}
