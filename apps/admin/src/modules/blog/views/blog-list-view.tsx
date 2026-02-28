"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useBlogPageData } from "@app/lib/hooks";

import { BlogListSection } from "../sections";

export const BlogListView = () => (
  <AdminListView queryResult={useBlogPageData()} loadingMessage="Loading posts...">
    {(data) => <BlogListSection posts={data.posts} />}
  </AdminListView>
);
