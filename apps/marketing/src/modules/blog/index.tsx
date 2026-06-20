import { type BlogPageData } from "@repo/contracts/cms/pages";

import { BlogFeaturedSection, BlogPostsGrid } from "./sections";

type BlogPageContentProps = {
  data: BlogPageData;
};

export const BlogPageContent = ({ data }: BlogPageContentProps) => (
  <>
    {data.hero && data.grid && (
      <BlogFeaturedSection hero={data.hero} grid={data.grid} featuredPost={data.featuredPost} />
    )}

    {data.grid && <BlogPostsGrid grid={data.grid} posts={data.posts} />}
  </>
);
