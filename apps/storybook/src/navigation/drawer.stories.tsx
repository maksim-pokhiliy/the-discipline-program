import { useState } from "react";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Navigation/Drawer",
  component: Drawer,
  args: {
    open: false,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  { label: "Workouts", icon: <FitnessCenterIcon /> },
  { label: "Athletes", icon: <PeopleIcon /> },
  { label: "Settings", icon: <SettingsIcon /> },
];

const DrawerContent = () => (
  <Box>
    <List>
      {NAV_ITEMS.map(({ label, icon }) => (
        <ListItem key={label} disablePadding>
          <ListItemButton>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
    <Divider />
    <List>
      <ListItem disablePadding>
        <ListItemButton>
          <ListItemText primary="Log out" />
        </ListItemButton>
      </ListItem>
    </List>
  </Box>
);

const useDrawer = () => {
  const [open, setOpen] = useState(false);

  return { open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) };
};

const AnchorStory = () => {
  const left = useDrawer();
  const right = useDrawer();
  const top = useDrawer();
  const bottom = useDrawer();

  return (
    <StoryPage>
      <StorySection title="anchor">
        <Button variant="outlined" onClick={left.toggle}>
          Left
        </Button>
        <Drawer anchor="left" open={left.open} onClose={left.close}>
          <DrawerContent />
        </Drawer>

        <Button variant="outlined" onClick={right.toggle}>
          Right
        </Button>
        <Drawer anchor="right" open={right.open} onClose={right.close}>
          <DrawerContent />
        </Drawer>

        <Button variant="outlined" onClick={top.toggle}>
          Top
        </Button>
        <Drawer anchor="top" open={top.open} onClose={top.close}>
          <DrawerContent />
        </Drawer>

        <Button variant="outlined" onClick={bottom.toggle}>
          Bottom
        </Button>
        <Drawer anchor="bottom" open={bottom.open} onClose={bottom.close}>
          <DrawerContent />
        </Drawer>
      </StorySection>
    </StoryPage>
  );
};

export const Anchor: Story = {
  render: () => <AnchorStory />,
};

const VariantStory = () => {
  const temporary = useDrawer();
  const persistent = useDrawer();

  return (
    <StoryPage>
      <StorySection title="variant">
        <Button variant="outlined" onClick={temporary.toggle}>
          Temporary
        </Button>
        <Drawer variant="temporary" open={temporary.open} onClose={temporary.close}>
          <DrawerContent />
        </Drawer>

        <Button variant="outlined" onClick={persistent.toggle}>
          Persistent
        </Button>
        <Drawer variant="persistent" open={persistent.open} onClose={persistent.close}>
          <DrawerContent />
        </Drawer>
      </StorySection>
    </StoryPage>
  );
};

export const Variant: Story = {
  render: () => <VariantStory />,
};

export const Permanent: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="permanent (always visible)" direction="column">
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": { position: "static", width: 250 },
          }}
        >
          <DrawerContent />
        </Drawer>
      </StorySection>
    </StoryPage>
  ),
};
