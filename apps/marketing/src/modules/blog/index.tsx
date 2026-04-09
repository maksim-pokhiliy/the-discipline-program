"use client";

import { type BlogPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { useBlogPage } from "@app/lib/hooks";

import { BlogFeaturedSection, BlogPostsGrid } from "./sections";

type BlogPageClientProps = {
  initialData: BlogPageData;
};

export const BlogPageClient = ({ initialData }: BlogPageClientProps) => {
  const { data, isLoading, error } = useBlogPage({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading blog...">
      {(data) => (
        <>
          {data.featuredPost && (
            <BlogFeaturedSection hero={data.hero} featuredPost={data.featuredPost} />
          )}

          <BlogPostsGrid grid={data.grid} posts={data.posts} />
        </>
      )}
    </QueryWrapper>
  );
};
