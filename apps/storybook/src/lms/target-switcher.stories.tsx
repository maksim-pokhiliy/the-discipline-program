import { useState } from "react";

import { FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type Enrollment = {
  id: string;
  label: string;
};

type EditingTarget = { kind: "all" } | { kind: "athlete"; enrollmentId: string };

type DemoTargetSwitcherProps = {
  enrollments: Enrollment[];
};

const ALL_VALUE = "all";

const DemoTargetSwitcher = ({ enrollments }: DemoTargetSwitcherProps) => {
  const [target, setTarget] = useState<EditingTarget>({ kind: "all" });

  if (enrollments.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No enrollments — switcher hidden in production UI
      </Typography>
    );
  }

  const value = target.kind === "all" ? ALL_VALUE : `athlete:${target.enrollmentId}`;

  return (
    <Stack spacing={1}>
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel id="story-target-switcher-label">Editing for</InputLabel>
        <Select
          labelId="story-target-switcher-label"
          label="Editing for"
          value={value}
          onChange={(event) => {
            const next = event.target.value;

            if (next === ALL_VALUE) {
              setTarget({ kind: "all" });

              return;
            }

            const id = next.replace(/^athlete:/, "");

            setTarget({ kind: "athlete", enrollmentId: id });
          }}
        >
          <MenuItem value={ALL_VALUE}>All athletes</MenuItem>
          {enrollments.map((entry) => (
            <MenuItem key={entry.id} value={`athlete:${entry.id}`}>
              {entry.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary">
        Current: {target.kind === "all" ? "All athletes" : `athlete:${target.enrollmentId}`}
      </Typography>
    </Stack>
  );
};

const oneEnrollment: Enrollment[] = [{ id: "ckabcdef0000000000000abc1", label: "Tom Bradley" }];

const multipleEnrollments: Enrollment[] = [
  { id: "ckabcdef0000000000000abc1", label: "Tom Bradley" },
  { id: "ckabcdef0000000000000abc2", label: "Sarah Mitchell" },
  { id: "ckabcdef0000000000000abc3", label: "Alex Kim" },
];

const meta = {
  title: "LMS/TargetSwitcher",
  component: DemoTargetSwitcher,
  args: { enrollments: multipleEnrollments },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoTargetSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { enrollments: [] } };

export const SingleAthlete: Story = { args: { enrollments: oneEnrollment } };

export const MultipleAthletes: Story = { args: { enrollments: multipleEnrollments } };

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="empty (no enrollments)" direction="column">
        <DemoTargetSwitcher enrollments={[]} />
      </StorySection>
      <StorySection title="single athlete" direction="column">
        <DemoTargetSwitcher enrollments={oneEnrollment} />
      </StorySection>
      <StorySection title="multiple athletes" direction="column">
        <DemoTargetSwitcher enrollments={multipleEnrollments} />
      </StorySection>
    </StoryPage>
  ),
};
