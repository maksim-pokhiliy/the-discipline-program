import { api } from "@app/lib/api";
import { BlogPageClient } from "@app/modules/blog";

export default async function BlogPage() {
  const initialData = await api.blog.getPageData();

  return <BlogPageClient initialData={initialData} />;
}
