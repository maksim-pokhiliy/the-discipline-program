import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { PagesEditView } from "@app/modules/pages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function PageEditPage({ params }: PageProps) {
  const { slug } = await params;
  const pageData = await fetchOrNotFound(() => serverApi.pages.getPageBySlug(slug));

  return <PagesEditView initialData={pageData} />;
}
