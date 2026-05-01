import { Box, Grid } from "@mui/material";

import { type BlogPostPageData, type PublicBlogPostPreview } from "@repo/contracts/cms/blog";
import { ContentSection } from "@repo/ui";

import { BlogPostCard } from "@app/lib/components/ui";

type BlogArticleRelatedProps = {
  relatedPosts: PublicBlogPostPreview[];
  sectionTitle?: string | undefined;
  labels: BlogPostPageData["labels"];
};

export const BlogArticleRelated = ({
  relatedPosts,
  sectionTitle,
  labels,
}: BlogArticleRelatedProps) => {
  return (
    <Box sx={{ borderTop: 1, borderColor: "divider" }}>
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
                readMoreLabel={labels.readMoreLabel ?? ""}
                minReadSuffix={labels.minReadSuffix ?? ""}
              />
            </Grid>
          ))}
        </Grid>
      </ContentSection>
    </Box>
  );
};
