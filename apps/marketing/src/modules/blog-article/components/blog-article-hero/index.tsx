import { Typography, Container, Stack, Chip, Box } from "@mui/material";
import { BlogPost } from "@repo/api";
import Image from "next/image";

interface BlogArticleHeroProps {
  post: BlogPost;
}

export const BlogArticleHero = ({ post }: BlogArticleHeroProps) => {
  const publishedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <Image
          src={post.coverImage}
          alt={post.title}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          fill
          priority
          style={{
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          py: { xs: 8, md: 12 },
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Chip label={post.category} color="primary" sx={{ fontWeight: 600 }} />

            <Typography
              variant="h1"
              component="h1"
              sx={{
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                color: "white",
              }}
            >
              {post.title}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                maxWidth: "800px",
                lineHeight: 1.6,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              {post.excerpt}
            </Typography>

            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "0.875rem",
              }}
            >
              <Typography variant="body2">{post.author}</Typography>
              <Typography variant="body2">•</Typography>
              <Typography variant="body2">{publishedDate}</Typography>
              <Typography variant="body2">•</Typography>
              <Typography variant="body2">{post.readTime} min read</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
