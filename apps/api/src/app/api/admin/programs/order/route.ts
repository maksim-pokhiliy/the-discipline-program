import { NextResponse } from "next/server";

import { adminProgramsApi } from "@repo/api-server";
import { updateProgramsOrderRequestSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updates = updateProgramsOrderRequestSchema.parse(body);

    await adminProgramsApi.updateProgramsOrder(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
