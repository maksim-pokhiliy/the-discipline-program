import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { BLOG_CATEGORY_LABELS, type PublicBlogPost } from "@repo/contracts/blog";
import { type BlogPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { MIN_READ_SUFFIX, READ_MORE_LABEL } from "@app/lib/config";

type BlogFeaturedSectionProps = {
  hero: BlogPageData["hero"];
  featuredPost: PublicBlogPost;
};

export const BlogFeaturedSection = ({ hero, featuredPost }: BlogFeaturedSectionProps) => {
  return (
    <ContentSection id="featured" title={hero.title} subtitle={hero.subtitle} offset={1}>
      <Card>
        <Box sx={{ position: "relative" }}>
          {featuredPost.coverImage && (
            <CardMedia
              component="img"
              image={featuredPost.coverImage}
              alt={featuredPost.title}
              sx={{ height: (theme) => theme.spacing(50) }}
            />
          )}

          <Box
            sx={{
              position: "absolute",
              top: 2,
              left: 2,
              zIndex: 1,
            }}
          >
            <Chip label={BLOG_CATEGORY_LABELS[featuredPost.category]} color="primary" />
          </Box>
        </Box>

        <CardContent>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h1">{featuredPost.title}</Typography>

              <Typography variant="h5" color="text.secondary">
                {featuredPost.excerpt}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>

        <CardActions>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1" color="text.secondary">
                {featuredPost.authorName}
              </Typography>

              <Typography variant="body1" color="text.secondary">
                •
              </Typography>

              <Typography variant="body1" color="text.secondary">
                {featuredPost.readTime} {MIN_READ_SUFFIX}
              </Typography>
            </Stack>

            <Button
              component={Link}
              href={`/blog/${featuredPost.slug}`}
              variant="contained"
              size="medium"
            >
              {READ_MORE_LABEL}
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </ContentSection>
  );
};
