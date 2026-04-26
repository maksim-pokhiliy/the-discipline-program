import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { ExerciseEntryRow } from "@repo/ui";

const baseEntry: ExerciseEntry = {
  id: "ckabcdef0000000000000abc1",
  setGroupId: "ckabcdef0000000000000abc2",
  order: 0,
  exerciseId: "ckabcdef0000000000000abc3",
  exerciseSnapshot: {
    id: "ckabcdef0000000000000abc3",
    name: "Back Squat",
    primaryMovement: "SQUAT",
    modality: "BARBELL",
    primaryBodyParts: ["QUADS"],
    defaultMetrics: undefined,
    demoVideoUrl: null,
    demoImageUrl: null,
  },
  prescription: {
    reps: { kind: "FIXED", value: 5 },
    sideMode: "BILATERAL",
    modifiers: [],
  },
  alternatives: [],
  externalUrl: null,
  notes: null,
  version: 1,
};

const ControlledRow = ({ initial, mode }: { initial: ExerciseEntry; mode: "edit" | "read" }) => {
  const [entry, setEntry] = useState<ExerciseEntry>(initial);

  return (
    <ExerciseEntryRow
      entry={entry}
      mode={mode}
      onChange={(next) => setEntry((prev) => (typeof next === "function" ? next(prev) : next))}
    />
  );
};

const meta = {
  title: "LMS/ExerciseEntryRow",
  component: ControlledRow,
  args: { initial: baseEntry, mode: "edit" },
} satisfies Meta<typeof ControlledRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditMode: Story = { args: { initial: baseEntry, mode: "edit" } };

export const ReadMode: Story = { args: { initial: baseEntry, mode: "read" } };

export const DurationOnly: Story = {
  args: {
    initial: {
      ...baseEntry,
      prescription: {
        ...baseEntry.prescription,
        reps: undefined,
        durationSec: 60,
      },
    },
    mode: "edit",
  },
};
