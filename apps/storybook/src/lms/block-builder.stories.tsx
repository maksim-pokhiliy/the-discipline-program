import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { BlockBuilder } from "@repo/ui";

const baseBlock: Block = {
  id: "ckabcdef0000000000000abc1",
  sessionId: "ckabcdef0000000000000abc2",
  order: 0,
  kindId: "ckabcdef0000000000000abc3",
  title: "Squat focus",
  status: "ACTIVE",
  weight: 5,
  notes: null,
  version: 1,
};

const exampleKinds: BlockKind[] = [
  {
    id: "ckabcdef0000000000000abc3",
    scope: "SYSTEM",
    ownerId: null,
    name: "Strength",
    description: null,
    iconKey: null,
    defaultWeight: 5,
    defaultArchetypeKind: null,
    analyticsCategory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: "ckabcdef0000000000000abc4",
    scope: "SYSTEM",
    ownerId: null,
    name: "Conditioning",
    description: null,
    iconKey: null,
    defaultWeight: 4,
    defaultArchetypeKind: null,
    analyticsCategory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
];

const ControlledBuilder = ({
  initial,
  blockKinds,
}: {
  initial: Block;
  blockKinds?: BlockKind[];
}) => {
  const [block, setBlock] = useState<Block>(initial);

  return (
    <BlockBuilder
      block={block}
      blockKinds={blockKinds}
      onChange={(next) => setBlock((prev) => (typeof next === "function" ? next(prev) : next))}
    />
  );
};

const meta = {
  title: "LMS/BlockBuilder",
  component: ControlledBuilder,
  args: { initial: baseBlock, blockKinds: exampleKinds },
} satisfies Meta<typeof ControlledBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { initial: baseBlock, blockKinds: exampleKinds } };

export const NoKindLibrary: Story = {
  args: { initial: baseBlock, blockKinds: [] },
};

export const Suspended: Story = {
  args: {
    initial: { ...baseBlock, status: "SUSPENDED", weight: 1 },
    blockKinds: exampleKinds,
  },
};
