import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RowKindBadge, type RowKind } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/RowKindBadge",
  component: RowKindBadge,
  args: {
    kind: "ex",
  },
} satisfies Meta<typeof RowKindBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const KINDS = [
  "ex",
  "rest",
  "foot",
  "load",
  "url",
  "placeholder",
  "ladder",
] as const satisfies readonly RowKind[];

export const AllKinds: Story = {
  render: () => (
    <StoryPage>
      {KINDS.map((kind) => (
        <StorySection key={kind} title={kind}>
          <RowKindBadge kind={kind} />
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const WithLabelOverride: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="label override">
        <RowKindBadge kind="ex" label="Custom" />
        <RowKindBadge kind="rest" label="Pause" />
        <RowKindBadge kind="load" label="WT" />
      </StorySection>
    </StoryPage>
  ),
};
