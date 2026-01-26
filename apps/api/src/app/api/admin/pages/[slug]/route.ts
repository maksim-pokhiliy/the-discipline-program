import { type NextRequest, NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { adminPageDetailsSchema } from "@repo/contracts/pages";
import { handleApiError } from "@repo/errors";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const page = await adminPagesApi.getPageBySlug(slug);
    const validated = adminPageDetailsSchema.parse(page);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
