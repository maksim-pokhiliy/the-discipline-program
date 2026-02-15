"use client";

import { Container } from "@mui/material";

import { type AdminBlogPageData } from "@repo/contracts/blog";
import { QueryWrapper } from "@repo/query";

import { useBlogPageData } from "@app/lib/hooks";

import { BlogListSection } from "../sections";

interface BlogListViewProps {
  initialData: AdminBlogPageData;
}

export const BlogListView = ({ initialData }: BlogListViewProps) => {
  const { data, isLoading, error } = useBlogPageData({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading posts...">
      {(data) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <BlogListSection posts={data.posts} />
        </Container>
      )}
    </QueryWrapper>
  );
};
