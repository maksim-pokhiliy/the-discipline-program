"use client";

import { Box, Typography } from "@mui/material";

import { useTouchTargetSx } from "../plan-canvas/use-touch-target-sx";

type LibraryListItemProps = {
  name: string;
  scope?: string;
};

export const LibraryListItem = ({ name, scope }: LibraryListItemProps) => {
  const touchTargetSx = useTouchTargetSx();

  return (
    <Box
      sx={[
        {
          px: 1,
          py: 0.75,
          borderRadius: 1,
          cursor: "grab",
          "&:hover": { bgcolor: "action.hover" },
        },
        touchTargetSx,
      ]}
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
};
