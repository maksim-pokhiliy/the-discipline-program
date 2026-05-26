import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { IndicatorChip, type IndicatorChipTone } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const COMPONENT_DESCRIPTION = [
  "Filled tonal indicator with leading dot — drop-in replacement for the previous outlined indicator.",
  "20px sizeSmall pill, color-tinted background and text via theme palette, leading 5×5 currentColor dot rendered into the chip icon slot.",
  "Reworked in C4 to match the prototype `.chip-i` filled tonal pill style for plan editor block meta chips.",
].join(" ");

const INTRO_TITLE = "filled tonal pill with leading 5×5 dot — C4 rework";

const meta = {
  title: "Composites/IndicatorChip",
  component: IndicatorChip,
  args: {
    tone: "default",
    label: "",
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
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
      <StorySection title={INTRO_TITLE}>
        <IndicatorChip tone="primary" label="C4" />
      </StorySection>
      {TONES.map((tone) => (
        <StorySection key={tone} title={tone}>
          <IndicatorChip tone={tone} label={tone} />
        </StorySection>
      ))}
    </StoryPage>
  ),
};
