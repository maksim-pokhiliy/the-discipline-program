import { adminBlogApi } from "@repo/api/server";

import { BlogPageClient } from "@app/modules/blog";

export default async function BlogPage() {
  const initialData = await adminBlogApi.getBlogPageData();

  return <BlogPageClient initialData={initialData} />;
}
