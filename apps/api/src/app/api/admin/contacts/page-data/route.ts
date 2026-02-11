import { NextResponse } from "next/server";

import { adminContactsApi } from "@repo/api-server";
import { getContactsPageDataResponseSchema } from "@repo/contracts/contact";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminContactsApi.getContactsPageData();
    const validated = getContactsPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
