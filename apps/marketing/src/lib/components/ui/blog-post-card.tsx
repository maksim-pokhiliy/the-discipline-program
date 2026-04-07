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

type BlogPostCardProps = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readTime: number | null;
  category: string;
};

export const BlogPostCard = ({
  slug,
  title,
  excerpt,
  coverImage,
  readTime,
  category,
}: BlogPostCardProps) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "relative" }}>
        {coverImage && <CardMedia component="img" height="200" image={coverImage} alt={title} />}

        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 1,
          }}
        >
          <Chip label={category} size="small" color="primary" />
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h3">
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {excerpt}
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
          <Typography variant="caption" color="text.secondary">
            {readTime} min read
          </Typography>

          <Button component={Link} href={`/blog/${slug}`} size="small">
            Read More
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
};
