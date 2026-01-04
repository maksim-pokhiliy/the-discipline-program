import { api } from "@app/lib/api";
import { BlogPageClient } from "@app/modules/blog";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const initialData = await api.blog.getPageData();

  return <BlogPageClient initialData={initialData} />;
}
