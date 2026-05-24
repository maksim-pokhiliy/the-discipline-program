import StarIcon from "@mui/icons-material/Star";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TogglePill } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/TogglePill",
  component: TogglePill,
  args: {
    icon: <StarIcon />,
    active: false,
    label: "",
    onChange: () => {},
  },
} satisfies Meta<typeof TogglePill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="inactive">
        <TogglePill icon={<StarIcon />} active={false} label="Favorite" onChange={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};

export const ActiveInfo: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="active — default info">
        <TogglePill icon={<StarIcon />} active label="Favorite" onChange={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};

export const ActiveSuccess: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="active — success">
        <TogglePill
          icon={<StarIcon />}
          active
          label="Completed"
          activeColor="success"
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const ActivePrimary: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="active — primary">
        <TogglePill
          icon={<StarIcon />}
          active
          label="Pinned"
          activeColor="primary"
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="active + inactive — star icon">
        <TogglePill icon={<StarIcon />} active={false} label="Off" onChange={() => {}} />
        <TogglePill icon={<StarIcon />} active label="On" onChange={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};
