import { Button, CircularProgress } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Feedback/Circular Progress",
  component: CircularProgress,
} satisfies Meta<typeof CircularProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = ["primary", "secondary", "error", "warning", "info", "success", "inherit"] as const;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="indeterminate — colors">
        {COLORS.map((color) => (
          <CircularProgress key={color} color={color} />
        ))}
      </StorySection>

      <StorySection title="sizes">
        <CircularProgress size={16} />
        <CircularProgress size={24} />
        <CircularProgress size={40} />
        <CircularProgress size={56} />
      </StorySection>

      <StorySection title="determinate">
        <CircularProgress variant="determinate" value={0} />
        <CircularProgress variant="determinate" value={25} />
        <CircularProgress variant="determinate" value={50} />
        <CircularProgress variant="determinate" value={75} />
        <CircularProgress variant="determinate" value={100} />
      </StorySection>

      <StorySection title="in button (real usage)">
        <Button variant="contained" disabled startIcon={<CircularProgress size={16} />}>
          Saving...
        </Button>
        <Button variant="outlined" disabled startIcon={<CircularProgress size={16} />}>
          Loading...
        </Button>
      </StorySection>
    </StoryPage>
  ),
};
