import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const NEW_SIZE_MATRIX = [
  { size: "small", px: 28, label: "28 small" },
  { size: "medium", px: 32, label: "32 medium" },
  { size: "large", px: 40, label: "40 large" },
] as const;

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

export const NewSizeMatrix: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="28 / 32 / 40 matrix (D-01)" direction="row">
        {NEW_SIZE_MATRIX.map(({ size, px, label }) => (
          <Stack key={size} spacing={1} alignItems="center">
            <Box
              sx={{
                width: px,
                height: px,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconButton size={size} aria-label={label}>
                <SettingsIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Stack>
        ))}
      </StorySection>
    </StoryPage>
  ),
};
