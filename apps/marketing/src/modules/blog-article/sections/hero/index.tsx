import { Button, Chip, Stack, Typography } from "@mui/material";

import {
  BLOG_CATEGORY_LABELS,
  type BlogPostPageData,
  type PublicBlogPost,
} from "@repo/contracts/blog";

import { FullscreenSection } from "@app/lib/components/ui";

type BlogArticleHeroProps = {
  post: PublicBlogPost;
  labels: BlogPostPageData["labels"];
};

export const BlogArticleHero = ({ post, labels }: BlogArticleHeroProps) => {
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not published";

  return (
    <FullscreenSection backgroundImage={post.coverImage ?? "/images/pages/home-hero.png"}>
      <Chip label={BLOG_CATEGORY_LABELS[post.category]} color="primary" />

      <Typography variant="display1" component="h1" textAlign="center">
        {post.title}
      </Typography>

      <Typography
        variant="h5"
        sx={(theme) => ({
          color: theme.palette.text.secondary,
        })}
      >
        {post.excerpt}
      </Typography>

      <Stack
        direction="row"
        spacing={3}
        alignItems="center"
        sx={(theme) => ({
          color: theme.palette.text.secondary,
        })}
        divider={<Typography variant="body1">•</Typography>}
      >
        <Typography variant="body1">{post.authorName}</Typography>
        <Typography variant="body1">{publishedDate}</Typography>
        <Typography variant="body1">
          {post.readTime} {labels.minReadSuffix}
        </Typography>
      </Stack>

      <Button size="large" variant="contained" href="#content" sx={{ mt: 4 }}>
        {labels.readArticleLabel}
      </Button>
    </FullscreenSection>
  );
};
