import { type NextRequest, NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { formatError } from "@repo/errors";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const page = await adminPagesApi.getPageBySlug(slug);

    return NextResponse.json(page);
  } catch (error) {
    return formatError(error);
  }
}
