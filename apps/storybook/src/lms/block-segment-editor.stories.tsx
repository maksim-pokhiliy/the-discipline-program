import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { BlockSegmentEditor } from "@repo/ui";

const baseSegment: BlockSegment = {
  id: "ckabcdef0000000000000abc1",
  blockId: "ckabcdef0000000000000abc2",
  order: 0,
  label: "Segment A",
  archetypeKind: "COUNT_DOWN",
  schemeParams: { kind: "COUNT_DOWN", durationSec: 600 },
  schemeTemplateId: null,
  restConfig: null,
  version: 1,
};

const ControlledEditor = ({ initial }: { initial: BlockSegment }) => {
  const [segment, setSegment] = useState<BlockSegment>(initial);

  return (
    <BlockSegmentEditor
      segment={segment}
      onChange={(next) => setSegment((prev) => (typeof next === "function" ? next(prev) : next))}
    />
  );
};

const meta = {
  title: "LMS/BlockSegmentEditor",
  component: ControlledEditor,
  args: { initial: baseSegment },
} satisfies Meta<typeof ControlledEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CountDown: Story = { args: { initial: baseSegment } };

export const EmomLoop: Story = {
  args: {
    initial: {
      ...baseSegment,
      archetypeKind: "EMOM_LOOP",
      schemeParams: {
        kind: "EMOM_LOOP",
        totalMinutes: 12,
        slots: [{ minutes: [0, 1], action: { kind: "REST" } }],
      },
    },
  },
};

export const NoLabel: Story = {
  args: {
    initial: { ...baseSegment, label: null },
  },
};
