"use client";

import { useEffect, useRef, useState } from "react";

import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import TuneIcon from "@mui/icons-material/Tune";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { BottomNavigation, BottomNavigationAction, Box, Drawer, Paper, Stack } from "@mui/material";

import { BulkActionToolbar } from "./bulk-action-toolbar";
import { InspectorPanel } from "./inspector";
import { LibraryPanel } from "./library-panel";
import { PlanCanvas, usePlanCanvasSelection } from "./plan-canvas";

const DRAWER_HEIGHT_VH = 75;

type MobilePane = "library" | "canvas" | "inspector";

type PlanEditorMobileChromeProps = {
  planId: string;
};

export const PlanEditorMobileChrome = ({ planId }: PlanEditorMobileChromeProps) => {
  const [pane, setPane] = useState<MobilePane>("canvas");
  const { selection } = usePlanCanvasSelection();
  const lastSelectionKey = useRef<string | null>(null);

  useEffect(() => {
    if (!selection || selection.ids.length === 0) {
      lastSelectionKey.current = null;

      return;
    }

    const key = `${selection.kind}:${selection.ids.join(",")}`;

    if (lastSelectionKey.current === key) {
      return;
    }

    lastSelectionKey.current = key;
    setPane("inspector");
  }, [selection]);

  const handleClose = () => setPane("canvas");

  return (
    <Stack
      sx={{
        flex: 1,
        minHeight: 0,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Stack
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: "relative",
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
          <PlanCanvas planId={planId} />
        </Box>
        <BulkActionToolbar planId={planId} />
      </Stack>

      <Drawer
        anchor="bottom"
        open={pane === "library"}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              height: `${DRAWER_HEIGHT_VH.toString()}dvh`,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          },
        }}
      >
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          <LibraryPanel />
        </Box>
      </Drawer>

      <Drawer
        anchor="bottom"
        open={pane === "inspector"}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              height: `${DRAWER_HEIGHT_VH.toString()}dvh`,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          },
        }}
      >
        <Box sx={{ height: "100%", overflow: "hidden" }}>
          <InspectorPanel planId={planId} />
        </Box>
      </Drawer>

      <Paper
        elevation={3}
        sx={{
          borderTop: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <BottomNavigation
          value={pane}
          onChange={(_, next: MobilePane) => setPane(next)}
          showLabels
          sx={{ minHeight: 56 }}
        >
          <BottomNavigationAction value="library" label="Library" icon={<LibraryBooksIcon />} />
          <BottomNavigationAction value="canvas" label="Canvas" icon={<ViewModuleIcon />} />
          <BottomNavigationAction value="inspector" label="Inspector" icon={<TuneIcon />} />
        </BottomNavigation>
      </Paper>
    </Stack>
  );
};
