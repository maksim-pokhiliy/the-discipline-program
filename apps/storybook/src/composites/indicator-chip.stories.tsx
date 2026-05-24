import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { IndicatorChip, type IndicatorChipTone } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/IndicatorChip",
  component: IndicatorChip,
  args: {
    tone: "default",
    label: "",
  },
} satisfies Meta<typeof IndicatorChip>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONES = [
  "default",
  "primary",
  "info",
  "success",
  "warning",
  "error",
] as const satisfies readonly IndicatorChipTone[];

export const AllTones: Story = {
  render: () => (
    <StoryPage>
      {TONES.map((tone) => (
        <StorySection key={tone} title={tone}>
          <IndicatorChip tone={tone} label={tone} />
        </StorySection>
      ))}
    </StoryPage>
  ),
};
