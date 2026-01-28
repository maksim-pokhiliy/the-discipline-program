import { type NextRequest, NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { handleApiError } from "@repo/errors";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const data = await adminPagesApi.getPageBySlug(slug);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const body = await req.json();

    await adminPagesApi.updatePageMetadata(slug, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
