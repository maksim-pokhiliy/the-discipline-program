import DeleteIcon from "@mui/icons-material/Delete";
import { Button, IconButton, Tooltip } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/Tooltip",
  component: Tooltip,
  args: {
    title: "Tooltip",
    children: <Button>Hover me</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="placement">
        <Tooltip title="Top" placement="top">
          <Button size="small">Top</Button>
        </Tooltip>
        <Tooltip title="Bottom" placement="bottom">
          <Button size="small">Bottom</Button>
        </Tooltip>
        <Tooltip title="Left" placement="left">
          <Button size="small">Left</Button>
        </Tooltip>
        <Tooltip title="Right" placement="right">
          <Button size="small">Right</Button>
        </Tooltip>
      </StorySection>

      <StorySection title="with arrow">
        <Tooltip title="With arrow" arrow placement="top">
          <Button size="small">Arrow</Button>
        </Tooltip>
        <Tooltip title="With arrow bottom" arrow placement="bottom">
          <Button size="small">Arrow Bottom</Button>
        </Tooltip>
      </StorySection>

      <StorySection title="on icon button">
        <Tooltip title="Delete" placement="top">
          <IconButton aria-label="Delete">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete" placement="top" arrow>
          <IconButton aria-label="Delete">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </StorySection>

      <StorySection title="multiline">
        <Tooltip
          title="This is a longer tooltip text that spans multiple lines to show how it wraps"
          placement="top"
        >
          <Button size="small">Long text</Button>
        </Tooltip>
      </StorySection>
    </StoryPage>
  ),
};
