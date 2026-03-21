import FaceIcon from "@mui/icons-material/Face";
import { Avatar, Chip } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/Chip",
  component: Chip,
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = ["default", "primary", "secondary", "error", "warning", "success", "info"] as const;

export const FilledByColor: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="filled — medium">
        {COLORS.map((color) => (
          <Chip key={color} label={color} color={color} />
        ))}
      </StorySection>

      <StorySection title="filled — small">
        {COLORS.map((color) => (
          <Chip key={color} label={color} color={color} size="small" />
        ))}
      </StorySection>
    </StoryPage>
  ),
};

export const OutlinedByColor: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="outlined — medium">
        {COLORS.map((color) => (
          <Chip key={color} label={color} color={color} variant="outlined" />
        ))}
      </StorySection>

      <StorySection title="outlined — small">
        {COLORS.map((color) => (
          <Chip key={color} label={color} color={color} variant="outlined" size="small" />
        ))}
      </StorySection>
    </StoryPage>
  ),
};

export const Interactive: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="clickable">
        <Chip label="Clickable" clickable />
        <Chip label="Clickable" clickable color="primary" />
        <Chip label="Clickable" clickable variant="outlined" />
      </StorySection>

      <StorySection title="deletable">
        <Chip label="Deletable" onDelete={() => {}} />
        <Chip label="Deletable" onDelete={() => {}} color="primary" />
        <Chip label="Deletable" onDelete={() => {}} variant="outlined" />
        <Chip label="Small" onDelete={() => {}} size="small" />
      </StorySection>

      <StorySection title="disabled">
        <Chip label="Disabled" disabled />
        <Chip label="Disabled" disabled color="primary" />
        <Chip label="Disabled" disabled variant="outlined" />
      </StorySection>
    </StoryPage>
  ),
};

export const WithIconOrAvatar: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="with icon">
        <Chip icon={<FaceIcon />} label="With Icon" />
        <Chip icon={<FaceIcon />} label="With Icon" color="primary" />
        <Chip icon={<FaceIcon />} label="With Icon" variant="outlined" />
        <Chip icon={<FaceIcon />} label="Small" size="small" />
      </StorySection>

      <StorySection title="with avatar">
        <Chip avatar={<Avatar>M</Avatar>} label="With Avatar" />
        <Chip avatar={<Avatar>M</Avatar>} label="With Avatar" color="primary" />
        <Chip avatar={<Avatar>M</Avatar>} label="With Avatar" variant="outlined" />
      </StorySection>
    </StoryPage>
  ),
};
