import { Box, Container, Grid, Stack, Typography } from "@mui/material";

import { type PublicBlogPostPreview } from "@repo/contracts/blog";

import { BlogPostCard } from "@app/lib/components/ui";

type BlogArticleRelatedProps = {
  relatedPosts: PublicBlogPostPreview[];
  sectionTitle: string;
};

export const BlogArticleRelated = ({ relatedPosts, sectionTitle }: BlogArticleRelatedProps) => {
  return (
    <Box
      sx={(theme) => ({
        py: 8,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Container maxWidth="lg">
        <Stack spacing={8}>
          <Typography variant="h3" component="h2" textAlign="center">
            {sectionTitle}
          </Typography>

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
        </Stack>
      </Container>
    </Box>
  );
};
