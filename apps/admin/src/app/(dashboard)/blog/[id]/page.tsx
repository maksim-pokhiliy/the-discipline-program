import { serverApi } from "@app/lib/api/server";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { BlogEditView } from "@app/modules/blog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function BlogEditPage({ params }: PageProps) {
  const { id } = await params;
  const post = await fetchOrNotFound(() => serverApi.blog.getById(id));

  return <BlogEditView initialData={post} />;
}
