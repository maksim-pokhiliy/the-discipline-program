import { Grid } from "@mui/material";

import { type PublicBlogPost } from "@repo/contracts/blog";
import { type BlogPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { BlogPostCard } from "@app/lib/components/ui";

type BlogPostsGridProps = {
  grid: BlogPageData["grid"];
  posts: PublicBlogPost[];
};

export const BlogPostsGrid = ({ grid, posts }: BlogPostsGridProps) => {
  return (
    <ContentSection id="articles" title={grid.title} subtitle={grid.subtitle} surface="raised">
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid key={post.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <BlogPostCard
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              coverImage={post.coverImage}
              readTime={post.readTime}
              category={post.category}
            />
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
