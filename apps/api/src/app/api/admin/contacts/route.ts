import { NextResponse } from "next/server";

import { adminContactsApi } from "@repo/api-server";
import { getContactSubmissionsResponseSchema } from "@repo/contracts/contact";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const contacts = await adminContactsApi.getContacts();
    const validated = getContactSubmissionsResponseSchema.parse(contacts);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
