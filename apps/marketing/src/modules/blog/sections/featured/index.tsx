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

import { type BlogCategory, BLOG_CATEGORY_LABELS, type PublicBlogPost } from "@repo/contracts/blog";
import { type BlogPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface BlogFeaturedSectionProps {
  hero: BlogPageData["hero"];
  featuredPost: PublicBlogPost;
}

export const BlogFeaturedSection = ({ hero, featuredPost }: BlogFeaturedSectionProps) => {
  return (
    <ContentSection id="featured" title={hero.title} subtitle={hero.subtitle} offset={1}>
      <Card>
        <Box sx={{ position: "relative" }}>
          {featuredPost.coverImage && (
            <CardMedia
              component="img"
              height="400"
              image={featuredPost.coverImage}
              alt={featuredPost.title}
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
            <Chip
              label={
                BLOG_CATEGORY_LABELS[featuredPost.category as BlogCategory] ?? featuredPost.category
              }
              color="primary"
            />
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
                {featuredPost.readTime} min read
              </Typography>
            </Stack>

            <Button
              component={Link}
              href={`/blog/${featuredPost.slug}`}
              variant="contained"
              size="medium"
            >
              read more
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </ContentSection>
  );
};
