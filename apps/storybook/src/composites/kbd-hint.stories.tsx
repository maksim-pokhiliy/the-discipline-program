import { Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KbdHint } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/KbdHint",
  component: KbdHint,
  args: {
    children: null,
  },
} satisfies Meta<typeof KbdHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="single key">
        <KbdHint>⌘K</KbdHint>
      </StorySection>
    </StoryPage>
  ),
};

export const Combo: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="combo — stacked tokens">
        <Stack direction="row" gap={0.5} alignItems="center">
          <KbdHint>⌘</KbdHint>
          <KbdHint>⇧</KbdHint>
          <KbdHint>P</KbdHint>
        </Stack>
      </StorySection>
    </StoryPage>
  ),
};
