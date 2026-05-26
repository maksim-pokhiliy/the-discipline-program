import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlusRowButton } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const COMPONENT_DESCRIPTION = [
  "Dashed-outlined add-row button matching prototype `.plus-row` visual, with a literal `+` icon-circle and uppercase label.",
  "Composite-encapsulated styled Button — variant outlined, color inherit, Barlow 11pt 700 0.08em uppercase, dividerStrong border, primary-on-hover.",
  "Introduced in C7 for the Plan Editor add-session / add-block / add-schema actions.",
].join(" ");

const ADD_LABELS = ["Add session", "Add block", "Add schema"] as const;

const noop = (): void => undefined;

const meta = {
  title: "Composites/PlusRowButton",
  component: PlusRowButton,
  args: {
    label: "Add session",
    onClick: noop,
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
  },
} satisfies Meta<typeof PlusRowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="plan-editor add-row buttons — C7">
        {ADD_LABELS.map((label) => (
          <PlusRowButton key={label} label={label} onClick={noop} />
        ))}
      </StorySection>
    </StoryPage>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="disabled state — pending mutation">
        <PlusRowButton label="Add session" onClick={noop} disabled />
      </StorySection>
    </StoryPage>
  ),
};
