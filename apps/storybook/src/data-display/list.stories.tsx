import DeleteIcon from "@mui/icons-material/Delete";
import InboxIcon from "@mui/icons-material/Inbox";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import StarIcon from "@mui/icons-material/Star";
import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/List",
  component: List,
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

const CONTAINER_SX = { width: 320 } as const;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="basic" direction="column">
        <List sx={CONTAINER_SX}>
          <ListItemButton>
            <ListItemText primary="Inbox" />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="Drafts" />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="Sent" />
          </ListItemButton>
        </List>
      </StorySection>

      <StorySection title="with icons" direction="column">
        <List sx={CONTAINER_SX}>
          <ListItemButton>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Inbox" secondary="3 new messages" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <StarIcon />
            </ListItemIcon>
            <ListItemText primary="Starred" secondary="12 items" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
      </StorySection>

      <StorySection title="selected + disabled" direction="column">
        <List sx={CONTAINER_SX}>
          <ListItemButton>
            <ListItemText primary="Default" />
          </ListItemButton>
          <ListItemButton selected>
            <ListItemText primary="Selected" />
          </ListItemButton>
          <ListItemButton disabled>
            <ListItemText primary="Disabled" />
          </ListItemButton>
        </List>
      </StorySection>

      <StorySection title="with secondary action" direction="column">
        <List sx={CONTAINER_SX}>
          <ListItem
            secondaryAction={
              <IconButton edge="end">
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="John Doe" secondary="john@example.com" />
            </ListItemButton>
          </ListItem>
          <ListItem
            secondaryAction={
              <IconButton edge="end">
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
          >
            <ListItemButton>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Jane Smith" secondary="jane@example.com" />
            </ListItemButton>
          </ListItem>
        </List>
      </StorySection>

      <StorySection title="with subheader + divider" direction="column">
        <List sx={CONTAINER_SX} subheader={<ListSubheader>Navigation</ListSubheader>}>
          <ListItemButton>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="Users" />
          </ListItemButton>
          <Divider />
          <ListItemButton>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
      </StorySection>

      <StorySection title="dense" direction="column">
        <List sx={CONTAINER_SX} dense>
          <ListItemButton>
            <ListItemText primary="Dense item 1" />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="Dense item 2" />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="Dense item 3" />
          </ListItemButton>
        </List>
      </StorySection>
    </StoryPage>
  ),
};
