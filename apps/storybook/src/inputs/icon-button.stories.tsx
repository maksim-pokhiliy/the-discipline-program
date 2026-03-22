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
            <IconButton key={color} size={size} color={color}>
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
        <IconButton>
          <AddIcon />
        </IconButton>
        <IconButton>
          <EditIcon />
        </IconButton>
        <IconButton>
          <DeleteIcon />
        </IconButton>
        <IconButton>
          <FavoriteIcon />
        </IconButton>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
        <IconButton>
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
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title="disabled">
        <IconButton disabled>
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title="color=primary disabled">
        <IconButton color="primary" disabled>
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
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title='edge="start"'>
        <IconButton edge="start">
          <SettingsIcon />
        </IconButton>
      </StorySection>

      <StorySection title='edge="end"'>
        <IconButton edge="end">
          <SettingsIcon />
        </IconButton>
      </StorySection>
    </StoryPage>
  ),
};
