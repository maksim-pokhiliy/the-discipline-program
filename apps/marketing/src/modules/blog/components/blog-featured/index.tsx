import { Typography, Button, Card, CardContent, Stack, Box, Chip } from "@mui/material";
import { BlogPost } from "@repo/api";
import Image from "next/image";
import Link from "next/link";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface BlogFeaturedSectionProps {
  featuredPost: BlogPost;
}

export const BlogFeaturedSection = ({ featuredPost }: BlogFeaturedSectionProps) => {
  return (
    <ContentSection title="Featured Article">
      <Card sx={{ overflow: "hidden" }}>
        <Box sx={{ position: "relative", height: 300 }}>
          <Image
            src={featuredPost.coverImage}
            alt={featuredPost.title}
            priority
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1,
            }}
          >
            <Chip label={featuredPost.category} color="primary" sx={{ fontWeight: 600 }} />
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h3" component="h2">
                {featuredPost.title}
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {featuredPost.excerpt}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {featuredPost.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  •
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {featuredPost.readTime} хв читання
                </Typography>
              </Stack>

              <Button
                component={Link}
                href={`/blog/${featuredPost.slug}`}
                variant="contained"
                size="large"
              >
                Read Article
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </ContentSection>
  );
};
