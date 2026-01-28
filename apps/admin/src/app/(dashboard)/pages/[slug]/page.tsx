import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { PagesEditView } from "@app/modules/pages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function PageEditPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const pageData = await api.pages.getPageBySlug(slug);

    return <PagesEditView initialData={pageData} />;
  } catch {
    return notFound();
  }
}
