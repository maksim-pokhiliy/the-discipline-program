import { useState } from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  type MenuProps,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Navigation/Menu",
  component: Menu,
  args: {
    open: false,
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

const useMenu = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);
  const bind: Pick<MenuProps, "anchorEl" | "open" | "onClose"> = {
    anchorEl,
    open,
    onClose: close,
  };
  const trigger = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);

  return { bind, trigger, close };
};

const BasicStory = () => {
  const { bind, trigger, close } = useMenu();

  return (
    <StoryPage>
      <StorySection title="basic" direction="row">
        <Button variant="outlined" onClick={trigger}>
          Open Menu
        </Button>
        <Menu {...bind}>
          <MenuItem onClick={close}>Workouts</MenuItem>
          <MenuItem onClick={close}>Athletes</MenuItem>
          <MenuItem onClick={close}>Programs</MenuItem>
          <MenuItem onClick={close}>Settings</MenuItem>
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const Basic: Story = {
  render: () => <BasicStory />,
};

const WithIconsStory = () => {
  const { bind, trigger, close } = useMenu();

  return (
    <StoryPage>
      <StorySection title="with icons" direction="row">
        <Button variant="outlined" onClick={trigger}>
          Actions
        </Button>
        <Menu {...bind}>
          <MenuItem onClick={close}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={close}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={close}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: "error.main" }}>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const WithIcons: Story = {
  render: () => <WithIconsStory />,
};

const DenseStory = () => {
  const { bind, trigger, close } = useMenu();

  return (
    <StoryPage>
      <StorySection title="dense" direction="row">
        <Button variant="outlined" onClick={trigger}>
          Dense Menu
        </Button>
        <Menu {...bind}>
          <MenuItem dense onClick={close}>
            Mon
          </MenuItem>
          <MenuItem dense onClick={close}>
            Tue
          </MenuItem>
          <MenuItem dense onClick={close}>
            Wed
          </MenuItem>
          <MenuItem dense onClick={close}>
            Thu
          </MenuItem>
          <MenuItem dense onClick={close}>
            Fri
          </MenuItem>
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const Dense: Story = {
  render: () => <DenseStory />,
};

const SelectedStory = () => {
  const { bind, trigger, close } = useMenu();

  return (
    <StoryPage>
      <StorySection title="selected item" direction="row">
        <Button variant="outlined" onClick={trigger}>
          With Selection
        </Button>
        <Menu {...bind}>
          <MenuItem onClick={close}>All</MenuItem>
          <MenuItem selected onClick={close}>
            Active
          </MenuItem>
          <MenuItem onClick={close}>Completed</MenuItem>
          <MenuItem disabled>Archived</MenuItem>
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const Selected: Story = {
  render: () => <SelectedStory />,
};

const MaxHeightStory = () => {
  const { bind, trigger, close } = useMenu();

  return (
    <StoryPage>
      <StorySection title="max height (scrollable)" direction="row">
        <Button variant="outlined" onClick={trigger}>
          Long Menu
        </Button>
        <Menu {...bind} slotProps={{ paper: { sx: { maxHeight: 200 } } }}>
          {Array.from({ length: 20 }, (_, i) => (
            <MenuItem key={i} onClick={close}>
              Option {i + 1}
            </MenuItem>
          ))}
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const MaxHeight: Story = {
  render: () => <MaxHeightStory />,
};
