import PersonIcon from "@mui/icons-material/Person";
import { Avatar } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="circular (default)">
        <Avatar>A</Avatar>
        <Avatar>MK</Avatar>
        <Avatar>
          <PersonIcon />
        </Avatar>
        <Avatar src="https://i.pravatar.cc/150?img=3" alt="User" />
      </StorySection>

      <StorySection title="rounded">
        <Avatar variant="rounded">A</Avatar>
        <Avatar variant="rounded">MK</Avatar>
        <Avatar variant="rounded">
          <PersonIcon />
        </Avatar>
        <Avatar variant="rounded" src="https://i.pravatar.cc/150?img=3" alt="User" />
      </StorySection>

      <StorySection title="square">
        <Avatar variant="square">A</Avatar>
        <Avatar variant="square">MK</Avatar>
        <Avatar variant="square">
          <PersonIcon />
        </Avatar>
        <Avatar variant="square" src="https://i.pravatar.cc/150?img=3" alt="User" />
      </StorySection>

      <StorySection title="fallback">
        <Avatar src="/broken.jpg">F</Avatar>
        <Avatar src="/broken.jpg" />
      </StorySection>
    </StoryPage>
  ),
};
