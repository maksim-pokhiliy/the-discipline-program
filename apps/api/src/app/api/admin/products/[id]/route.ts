import { NextResponse } from "next/server";

import { adminProductsApi } from "@repo/api-server";
import {
  getProductByIdParamsSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
  deleteProductParamsSchema,
} from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getProductByIdParamsSchema.parse(await params);
    const product = await adminProductsApi.getById(id);

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = updateProductParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateProductRequestSchema.parse(body);
    const product = await adminProductsApi.update(id, data);

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteProductParamsSchema.parse(await params);

    await adminProductsApi.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
