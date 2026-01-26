import { type NextRequest, NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { updatePageSectionSchema } from "@repo/contracts/pages";
import { formatError } from "@repo/errors";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const body = await req.json();

    const validatedData = updatePageSectionSchema.parse({
      ...body,
      pageSlug: slug,
    });

    await adminPagesApi.updateSection(validatedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    return formatError(error);
  }
}
