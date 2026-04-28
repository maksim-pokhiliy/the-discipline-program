"use client";

import { Box, Stack } from "@mui/material";

import { useBeforeunloadGuard } from "@repo/ui";

import { InspectorPanel } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { PlanCanvas } from "./plan-canvas";

const LIBRARY_WIDTH = 280;
const INSPECTOR_WIDTH = 360;

type PlanEditorChromeProps = {
  planId: string;
};

export const PlanEditorChrome = ({ planId }: PlanEditorChromeProps) => {
  useBeforeunloadGuard();

  return (
    <Stack
      direction="row"
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Box sx={{ width: LIBRARY_WIDTH, flexShrink: 0, height: "100%" }}>
        <LibraryPanel />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          display: "flex",
          height: "100%",
        }}
      >
        <PlanCanvas planId={planId} />
      </Box>

      <Box sx={{ width: INSPECTOR_WIDTH, flexShrink: 0, height: "100%" }}>
        <InspectorPanel planId={planId} />
      </Box>
    </Stack>
  );
};
