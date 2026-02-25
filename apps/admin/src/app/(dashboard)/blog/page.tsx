import { serverApi } from "@app/lib/api/server";
import { BlogListView } from "@app/modules/blog";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const initialData = await serverApi.blog.getPageData();

  return <BlogListView initialData={initialData} />;
}
