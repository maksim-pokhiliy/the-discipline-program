"use client";

import { Stack } from "@mui/material";
import { BlogPageData } from "@repo/api";
import { QueryWrapper } from "@repo/query";

import { useBlogPage } from "@app/lib/hooks";

import { BlogFeaturedSection, BlogHeroSection, BlogPostsGrid } from "./sections";

interface BlogPageClientProps {
  initialData: BlogPageData;
}

export const BlogPageClient = ({ initialData }: BlogPageClientProps) => {
  const { data, isLoading, error } = useBlogPage({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading blog...">
      {(data) => (
        <Stack spacing={0}>
          <BlogHeroSection hero={data.hero} />

          {data.featuredPost && <BlogFeaturedSection featuredPost={data.featuredPost} />}

          <BlogPostsGrid posts={data.posts} categories={data.categories} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
