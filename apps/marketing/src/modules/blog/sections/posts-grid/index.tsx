import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

import { type PublicBlogPost } from "@repo/contracts/blog";
import { ContentSection } from "@repo/ui";

interface BlogPostsGridProps {
  posts: PublicBlogPost[];
  categories: string[];
}

export const BlogPostsGrid = ({ posts }: BlogPostsGridProps) => {
  return (
    <ContentSection title="All Articles" backgroundColor="dark">
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid key={post.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ position: "relative", height: 200 }}>
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    priority
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  <Chip
                    label={post.category}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Stack spacing={3} sx={{ height: "100%" }}>
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.excerpt}
                    </Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {post.readTime} min read
                      </Typography>
                    </Stack>

                    <Button
                      component={Link}
                      href={`/blog/${post.slug}`}
                      variant="outlined"
                      size="small"
                    >
                      Read More
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
