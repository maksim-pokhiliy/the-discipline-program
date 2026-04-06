import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { type PublicBlogPost } from "@repo/contracts/blog";
import { type BlogPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface BlogPostsGridProps {
  grid: BlogPageData["grid"];
  posts: PublicBlogPost[];
}

export const BlogPostsGrid = ({ grid, posts }: BlogPostsGridProps) => {
  return (
    <ContentSection id="articles" title={grid.title} subtitle={grid.subtitle} surface="raised">
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid key={post.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card variant="elevation">
              <Box sx={{ position: "relative" }}>
                {post.coverImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={post.coverImage}
                    alt={post.title}
                  />
                )}

                <Box
                  sx={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    zIndex: 1,
                  }}
                >
                  <Chip label={post.category} size="small" color="primary" />
                </Box>
              </Box>

              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5" component="h3">
                    {post.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {post.excerpt}
                  </Typography>
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {post.readTime} min read
                    </Typography>
                  </Stack>

                  <Button component={Link} href={`/blog/${post.slug}`} size="small">
                    Read More
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
