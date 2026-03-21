import { Paper, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Surfaces/Paper",
  component: Paper,
  args: {
    children: undefined,
  },
} satisfies Meta<typeof Paper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="elevation=0 (default)">
        <Paper>
          <Typography>elevation=0</Typography>
        </Paper>
      </StorySection>

      <StorySection title="elevations">
        <Paper elevation={0}>
          <Typography>0</Typography>
        </Paper>
        <Paper elevation={1}>
          <Typography>1</Typography>
        </Paper>
        <Paper elevation={2}>
          <Typography>2</Typography>
        </Paper>
        <Paper elevation={4}>
          <Typography>4</Typography>
        </Paper>
        <Paper elevation={8}>
          <Typography>8</Typography>
        </Paper>
      </StorySection>

      <StorySection title="outlined">
        <Paper variant="outlined">
          <Typography>Outlined</Typography>
        </Paper>
      </StorySection>

      <StorySection title="square vs rounded">
        <Paper variant="outlined">
          <Typography>Rounded (default)</Typography>
        </Paper>
        <Paper variant="outlined" square>
          <Typography>Square</Typography>
        </Paper>
      </StorySection>
    </StoryPage>
  ),
};
