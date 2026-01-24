import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { handleApiError } from "@repo/errors";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const sections = await adminPagesApi.getPageSections(slug);

    return NextResponse.json(sections);
  } catch (error) {
    return handleApiError(error);
  }
}
