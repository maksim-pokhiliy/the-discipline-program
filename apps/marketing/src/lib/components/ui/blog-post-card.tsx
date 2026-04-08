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

import { type BlogCategory, BLOG_CATEGORY_LABELS } from "@repo/contracts/blog";

type BlogPostCardProps = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readTime: number | null;
  category: BlogCategory;
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
    <Card>
      <Box sx={{ position: "relative" }}>
        {coverImage && (
          <CardMedia
            component="img"
            image={coverImage}
            alt={title}
            sx={{ height: (theme) => theme.spacing(25) }}
          />
        )}

        <Box
          sx={{
            position: "absolute",
            top: 1.5,
            left: 1.5,
            zIndex: 1,
          }}
        >
          <Chip label={BLOG_CATEGORY_LABELS[category]} size="small" color="primary" />
        </Box>
      </Box>

      <CardContent>
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
