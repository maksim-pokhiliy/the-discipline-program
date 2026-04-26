"use client";

import { Box, Stack } from "@mui/material";

import { EditSessionProvider, useBeforeunloadGuard } from "@repo/ui";

import { InspectorPanel } from "../components/inspector";
import { LibraryPanel } from "../components/library-panel";
import { PlanCanvas } from "../components/plan-canvas";

const LIBRARY_WIDTH = 280;
const INSPECTOR_WIDTH = 360;

const PlanEditorChrome = ({ planId }: { planId: string }) => {
  useBeforeunloadGuard();

  return (
    <Stack
      direction="row"
      sx={{
        position: "fixed",
        inset: 0,
        top: 64,
        bottom: 56,
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ width: LIBRARY_WIDTH, flexShrink: 0 }}>
        <LibraryPanel />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, position: "relative", display: "flex" }}>
        <PlanCanvas planId={planId} />
      </Box>

      <Box sx={{ width: INSPECTOR_WIDTH, flexShrink: 0 }}>
        <InspectorPanel planId={planId} />
      </Box>
    </Stack>
  );
};

export type PlanEditorViewProps = {
  planId: string;
};

export const PlanEditorView = ({ planId }: PlanEditorViewProps) => {
  return (
    <EditSessionProvider>
      <PlanEditorChrome planId={planId} />
    </EditSessionProvider>
  );
};
