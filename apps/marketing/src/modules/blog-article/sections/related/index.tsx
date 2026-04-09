import { Box, Grid } from "@mui/material";

import { type PublicBlogPostPreview } from "@repo/contracts/blog";
import { ContentSection } from "@repo/ui";

import { BlogPostCard } from "@app/lib/components/ui";

type BlogArticleRelatedProps = {
  relatedPosts: PublicBlogPostPreview[];
  sectionTitle: string;
};

export const BlogArticleRelated = ({ relatedPosts, sectionTitle }: BlogArticleRelatedProps) => {
  return (
    <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}` })}>
      <ContentSection title={sectionTitle} surface="raised" animated={false}>
        <Grid container spacing={4}>
          {relatedPosts.map((post) => (
            <Grid key={post.id} size={{ xs: 12, md: 4 }}>
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
    </Box>
  );
};
