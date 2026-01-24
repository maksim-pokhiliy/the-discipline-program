import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { PAGES_SECTIONS_REGISTRY } from "@repo/contracts/pages";
import { NotFoundError, handleApiError } from "@repo/errors";

interface RouteParams {
  params: Promise<{
    slug: string;
    section: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { slug, section } = await params;
    const pageSchemas = PAGES_SECTIONS_REGISTRY[slug];

    if (!pageSchemas) {
      throw new NotFoundError(`Page configuration not found for slug: ${slug}`);
    }

    const schema = pageSchemas[section];

    if (!schema) {
      throw new NotFoundError(`Section schema not found: ${section} for page ${slug}`);
    }

    const body = await request.json();
    const validatedData = schema.parse(body);
    const updatedSection = await adminPagesApi.updateSection(slug, section, validatedData);

    return NextResponse.json(updatedSection);
  } catch (error) {
    return handleApiError(error);
  }
}
