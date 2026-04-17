"use client";

import AddIcon from "@mui/icons-material/Add";
import { Fab, type FabProps } from "@mui/material";

import { LAYOUT } from "@repo/shared";

type PlatformFabProps = Pick<FabProps, "onClick">;

export const PlatformFab = ({ onClick }: PlatformFabProps) => (
  <Fab
    color="primary"
    onClick={onClick}
    sx={{
      position: "fixed",
      bottom: `calc(${LAYOUT.platformFabBottom}px + env(safe-area-inset-bottom))`,
      right: `calc(${LAYOUT.platformFabRight}px + env(safe-area-inset-right))`,
    }}
  >
    <AddIcon />
  </Fab>
);
