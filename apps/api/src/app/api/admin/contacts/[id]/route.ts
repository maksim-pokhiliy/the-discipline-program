import { NextResponse } from "next/server";

import { adminContactsApi } from "@repo/api-server";
import {
  getContactByIdParamsSchema,
  updateContactParamsSchema,
  updateContactRequestSchema,
  deleteContactParamsSchema,
} from "@repo/contracts/contact";
import { handleApiError } from "@repo/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getContactByIdParamsSchema.parse(await params);
    const contact = await adminContactsApi.getContactById(id);

    return NextResponse.json(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = updateContactParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateContactRequestSchema.parse(body);
    const contact = await adminContactsApi.updateContact(id, data);

    return NextResponse.json(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteContactParamsSchema.parse(await params);

    await adminContactsApi.deleteContact(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
