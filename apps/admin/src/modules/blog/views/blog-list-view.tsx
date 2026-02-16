"use client";

import { type AdminBlogPageData } from "@repo/contracts/blog";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useBlogPageData } from "@app/lib/hooks";

import { BlogListSection } from "../sections";

interface BlogListViewProps {
  initialData: AdminBlogPageData;
}

export const BlogListView = ({ initialData }: BlogListViewProps) => (
  <AdminListView queryResult={useBlogPageData({ initialData })} loadingMessage="Loading posts...">
    {(data) => <BlogListSection posts={data.posts} />}
  </AdminListView>
);
