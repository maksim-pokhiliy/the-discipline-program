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
  readMoreLabel: string;
  minReadSuffix: string;
  variant?: "default" | "featured";
  authorName?: string | null;
};

export const BlogPostCard = ({
  slug,
  title,
  excerpt,
  coverImage,
  readTime,
  category,
  readMoreLabel,
  minReadSuffix,
  variant = "default",
  authorName,
}: BlogPostCardProps) => {
  const isFeatured = variant === "featured";

  return (
    <Card>
      <Box sx={{ position: "relative" }}>
        {coverImage && (
          <CardMedia
            component="img"
            image={coverImage}
            alt={title}
            sx={{ height: (theme) => theme.spacing(isFeatured ? 50 : 25) }}
          />
        )}

        <Box
          sx={{
            position: "absolute",
            top: (theme) => theme.spacing(1.5),
            left: (theme) => theme.spacing(1.5),
            zIndex: 1,
          }}
        >
          <Chip
            label={BLOG_CATEGORY_LABELS[category]}
            size={isFeatured ? "medium" : "small"}
            color="primary"
          />
        </Box>
      </Box>

      <CardContent>
        <Stack spacing={2}>
          <Typography variant={isFeatured ? "h1" : "h5"} component={isFeatured ? "h2" : "h3"}>
            {title}
          </Typography>

          <Typography variant={isFeatured ? "h5" : "body2"} color="text.secondary">
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
          <Stack direction="row" spacing={2} alignItems="center">
            {authorName && (
              <>
                <Typography variant="body1" color="text.secondary">
                  {authorName}
                </Typography>

                <Typography variant="body1" color="text.secondary">
                  •
                </Typography>
              </>
            )}

            <Typography variant={isFeatured ? "body1" : "caption"} color="text.secondary">
              {readTime} {minReadSuffix}
            </Typography>
          </Stack>

          <Button
            component={Link}
            href={`/blog/${slug}`}
            variant={isFeatured ? "contained" : "text"}
            size={isFeatured ? "medium" : "small"}
          >
            {readMoreLabel}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
};
