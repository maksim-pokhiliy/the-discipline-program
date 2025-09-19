"use client";

import { Stack } from "@mui/material";

import { useBlogPage } from "@app/lib/hooks";
import { QueryWrapper } from "@app/shared/components/ui";

import { BlogFeaturedSection, BlogHeroSection, BlogPostsGrid } from "./sections";

export const BlogPage = () => {
  const { data, isLoading, error } = useBlogPage();

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
