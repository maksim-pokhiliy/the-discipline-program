import { NextResponse } from "next/server";

import { adminStorefrontApi } from "@repo/api-server";
import { toggleStorefrontProgramStatusParamsSchema } from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleStorefrontProgramStatusParamsSchema.parse(await params);
    const program = await adminStorefrontApi.toggleProgramStatus(id);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}
