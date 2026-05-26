import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CascadeChip, IndicatorChip } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const COMPONENT_DESCRIPTION = [
  "Muted italic chip signalling a value cascading down from a parent (block intensity, cap, etc.).",
  "Filled sizeSmall pill with `action.hover` background and `text.subtle` color, no tone variants, no leading glyph.",
  "Introduced in C5 for the Plan Editor SchemaCard meta row, alongside own-override IndicatorChips.",
].join(" ");

const INTRO_TITLE = "muted italic chip — C5";

const meta = {
  title: "Composites/CascadeChip",
  component: CascadeChip,
  args: {
    text: "@ 75%",
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
  },
} satisfies Meta<typeof CascadeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

const CASCADE_SAMPLES = ["@ 75%", "RPE 8", "cap 10:00", "HR Z2", "pace · moderate"] as const;

export const Gallery: Story = {
  render: () => (
    <StoryPage>
      <StorySection title={INTRO_TITLE}>
        <CascadeChip text="@ 75%" />
      </StorySection>
      <StorySection title="typical cascade labels">
        {CASCADE_SAMPLES.map((text) => (
          <CascadeChip key={text} text={text} />
        ))}
      </StorySection>
      <StorySection title="own override vs cascade — visual contrast">
        <IndicatorChip tone="primary" label="@ 80%" dot={false} />
        <CascadeChip text="@ 75%" />
      </StorySection>
    </StoryPage>
  ),
};
