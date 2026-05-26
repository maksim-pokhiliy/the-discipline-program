import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormPill } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const COMPONENT_DESCRIPTION = [
  "Tiny accent-orange pill marking the non-atomic exercise form on a schema row (compound, cyclical, sandwich, or alternative, placeholder ref).",
  "Composite-encapsulated styled raw Chip — height 16px, paddingX 6px, fully rounded, Barlow regular 9.5pt 700 0.06em uppercase, kind.load color at 18% alpha background.",
  "Introduced in C6 for the Plan Editor SchemaRowCard.",
].join(" ");

const FORM_LABELS = [
  "compound",
  "cyclical",
  "sandwich",
  "or alternative",
  "placeholder ref",
] as const;

const meta = {
  title: "Composites/FormPill",
  component: FormPill,
  args: {
    text: "compound",
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
  },
} satisfies Meta<typeof FormPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="non-atomic exercise forms — C6">
        {FORM_LABELS.map((text) => (
          <FormPill key={text} text={text} />
        ))}
      </StorySection>
    </StoryPage>
  ),
};
