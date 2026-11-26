import { type ReactElement } from "react";

import { Box, Typography } from "@mui/material";

type ProductThumbnailProps = { title: string; imageUrl: string | null; isPreview?: boolean };

const THUMBNAIL_SIZE = 6;
const PREVIEW_SIZE = 24;

export const ProductThumbnail = ({
  title,
  imageUrl,
  isPreview = false,
}: ProductThumbnailProps): ReactElement =>
  imageUrl ? (
    <Box
      component="img"
      src={imageUrl}
      alt={`${title} photo`}
      sx={(theme) => ({
        width: isPreview ? "100%" : theme.spacing(THUMBNAIL_SIZE),
        height: theme.spacing(isPreview ? PREVIEW_SIZE : THUMBNAIL_SIZE),
        objectFit: "contain",
      })}
    />
  ) : (
    <Typography variant="caption" color="text.secondary">
      No photo
    </Typography>
  );
