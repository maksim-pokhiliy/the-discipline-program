"use client";

import { Box, Typography } from "@mui/material";

type LibraryListItemProps = {
  name: string;
  scope?: string;
};

export const LibraryListItem = ({ name, scope }: LibraryListItemProps) => (
  <Box
    sx={{
      px: 1,
      py: 0.75,
      borderRadius: 1,
      cursor: "grab",
      "&:hover": { bgcolor: "action.hover" },
    }}
  >
    <Typography variant="body2" noWrap>
      {name}
    </Typography>
    {scope && (
      <Typography variant="caption" color="text.secondary">
        {scope}
      </Typography>
    )}
  </Box>
);
