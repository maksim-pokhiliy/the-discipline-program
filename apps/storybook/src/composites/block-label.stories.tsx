import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BlockLabel } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/BlockLabel",
  component: BlockLabel,
  args: {
    text: "",
  },
} satisfies Meta<typeof BlockLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outlined: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="outlined — default">
        <BlockLabel text="strength" />
        <BlockLabel text="endurance" />
        <BlockLabel text="recovery" />
      </StorySection>
    </StoryPage>
  ),
};

export const Filled: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="filled">
        <BlockLabel text="strength" filled />
        <BlockLabel text="endurance" filled />
        <BlockLabel text="recovery" filled />
      </StorySection>
    </StoryPage>
  ),
};

export const Deletable: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="deletable — outlined">
        <BlockLabel text="warmup" onDelete={() => {}} />
        <BlockLabel text="metcon" onDelete={() => {}} />
      </StorySection>

      <StorySection title="deletable — filled">
        <BlockLabel text="warmup" filled onDelete={() => {}} />
        <BlockLabel text="metcon" filled onDelete={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};
