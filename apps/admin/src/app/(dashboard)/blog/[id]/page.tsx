import { api } from "@app/lib/api";
import { fetchOrNotFound } from "@app/lib/fetch-or-not-found";
import { BlogEditView } from "@app/modules/blog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function BlogEditPage({ params }: PageProps) {
  const { id } = await params;
  const post = await fetchOrNotFound(() => api.blog.getById(id));

  return <BlogEditView initialData={post} />;
}
