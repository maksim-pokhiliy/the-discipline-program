import { Box, Chip, Divider, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/Divider",
  component: Divider,
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="horizontal (default)" direction="column">
        <Divider />
        <Divider variant="middle" />
        <Divider variant="inset" />
      </StorySection>

      <StorySection title="vertical">
        <Box sx={{ height: 48 }}>
          <Divider orientation="vertical" />
        </Box>
        <Box sx={{ height: 48 }}>
          <Divider orientation="vertical" variant="middle" />
        </Box>
      </StorySection>

      <StorySection title="with text" direction="column">
        <Divider>CENTER</Divider>
        <Divider textAlign="left">LEFT</Divider>
        <Divider textAlign="right">RIGHT</Divider>
      </StorySection>

      <StorySection title="with chip" direction="column">
        <Divider>
          <Chip label="Chip" size="small" />
        </Divider>
      </StorySection>

      <StorySection title="light vs default" direction="column">
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          default
        </Typography>
        <Divider />
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          light
        </Typography>
        <Divider light />
      </StorySection>
    </StoryPage>
  ),
};
