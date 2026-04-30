import { useState } from "react";

import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import TuneIcon from "@mui/icons-material/Tune";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type MobilePane = "library" | "canvas" | "inspector";

type DemoMobileChromeProps = {
  initialPane?: MobilePane;
};

const PaneCanvas = () => (
  <Stack
    spacing={1}
    sx={{
      flex: 1,
      bgcolor: "background.default",
      p: 2,
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
    }}
  >
    <Typography variant="subtitle2">Canvas</Typography>
    <Typography variant="caption" color="text.secondary">
      Plan tree, weeks, days, blocks, segments, entries
    </Typography>
    <Box sx={{ flex: 1, bgcolor: "action.hover", borderRadius: 1, p: 1 }}>
      <Typography variant="caption">Week 1 / MON / Strength block / Squat 5×5</Typography>
    </Box>
  </Stack>
);

const PaneLibrary = () => (
  <Stack spacing={1} sx={{ p: 2 }}>
    <Typography variant="subtitle2">Library</Typography>
    <Typography variant="caption" color="text.secondary">
      Exercises • Block kinds • Schemes • Block tpl • Session tpl • Week tpl
    </Typography>
  </Stack>
);

const PaneInspector = () => (
  <Stack spacing={1} sx={{ p: 2 }}>
    <Typography variant="subtitle2">Inspector</Typography>
    <Typography variant="caption" color="text.secondary">
      Edit selected block / segment / entry
    </Typography>
  </Stack>
);

const DemoMobileChrome = ({ initialPane = "canvas" }: DemoMobileChromeProps) => {
  const [pane, setPane] = useState<MobilePane>(initialPane);

  return (
    <Stack
      sx={{
        width: 375,
        height: 667,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
        bgcolor: "background.paper",
      }}
    >
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
          <PaneCanvas />
        </Box>
      </Stack>

      <Drawer
        anchor="bottom"
        open={pane === "library"}
        onClose={() => setPane("canvas")}
        slotProps={{
          paper: {
            sx: {
              height: "75dvh",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          },
        }}
      >
        <PaneLibrary />
      </Drawer>

      <Drawer
        anchor="bottom"
        open={pane === "inspector"}
        onClose={() => setPane("canvas")}
        slotProps={{
          paper: {
            sx: {
              height: "75dvh",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          },
        }}
      >
        <PaneInspector />
      </Drawer>

      <Paper elevation={3} sx={{ borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
        <BottomNavigation
          value={pane}
          onChange={(_, value: MobilePane) => setPane(value)}
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

const meta = {
  title: "Plan Editor/Mobile Chrome",
  component: DemoMobileChrome,
  args: { initialPane: "canvas" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoMobileChrome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CanvasPane: Story = { args: { initialPane: "canvas" } };
export const LibraryPane: Story = { args: { initialPane: "library" } };
export const InspectorPane: Story = { args: { initialPane: "inspector" } };

export const AllPanes: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="canvas (default)" direction="column">
        <DemoMobileChrome initialPane="canvas" />
      </StorySection>
      <StorySection title="library drawer open" direction="column">
        <DemoMobileChrome initialPane="library" />
      </StorySection>
      <StorySection title="inspector drawer open" direction="column">
        <DemoMobileChrome initialPane="inspector" />
      </StorySection>
    </StoryPage>
  ),
};
