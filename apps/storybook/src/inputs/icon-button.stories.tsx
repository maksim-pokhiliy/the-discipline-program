import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import { IconButton } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/IconButton",
  component: IconButton,
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ["small", "medium", "large"] as const;
const COLORS = ["default", "primary", "secondary", "error", "warning", "info", "success"] as const;

export const SizeByColor: Story = {
  render: () => (
    <StoryPage>
      {SIZES.map((size) => (
        <StorySection key={size} title={size}>
          {COLORS.map((color) => (
            <IconButton key={color} size={size} color={color} aria-label="Settings">
              <SettingsIcon />
            </IconButton>
          ))}
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const Icons: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="various icons">
        <IconButton aria-label="Add">
          <AddIcon />
        </IconButton>
        <IconButton aria-label="Edit">
          <EditIcon />
        </IconButton>
        <IconButton aria-label="Delete">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="Favorite">
          <FavoriteIcon />
        </IconButton>
        <IconButton aria-label="More options">
          <MoreVertIcon />
        </IconButton>
        <IconButton aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>
    </StoryPage>
  ),
};

export const States: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="default">
        <IconButton aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title="disabled">
        <IconButton disabled aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title="color=primary disabled">
        <IconButton color="primary" disabled aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>
    </StoryPage>
  ),
};

export const Edge: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="edge=false (default)">
        <IconButton aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title='edge="start"'>
        <IconButton edge="start" aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title='edge="end"'>
        <IconButton edge="end" aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </StorySection>
    </StoryPage>
  ),
};
