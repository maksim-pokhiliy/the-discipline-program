import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { BlogEditView } from "@app/modules/blog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function BlogEditPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const post = await api.blog.getById(id);

    return <BlogEditView initialData={post} />;
  } catch {
    return notFound();
  }
}
