import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { PAGES_REGISTRY, type PageSlug } from "@repo/contracts/pages";
import { NotFoundError, handleApiError } from "@repo/errors";

function isValidPageSlug(slug: string): slug is PageSlug {
  return slug in PAGES_REGISTRY;
}

interface RouteParams {
  params: Promise<{
    slug: string;
    section: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { slug, section } = await params;

    if (!isValidPageSlug(slug)) {
      throw new NotFoundError(`Page configuration not found for slug: ${slug}`);
    }

    const pageSchemas = PAGES_REGISTRY[slug];

    if (!(section in pageSchemas)) {
      throw new NotFoundError(`Section schema not found: ${section} for page ${slug}`);
    }

    const schema = pageSchemas[section as keyof typeof pageSchemas];
    const body = await request.json();
    const validatedData = schema.parse(body);
    const updatedSection = await adminPagesApi.updateSection(slug, section, validatedData);

    return NextResponse.json(updatedSection);
  } catch (error) {
    return handleApiError(error);
  }
}
