import { useState } from "react";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type BulkSelectionKind = "block" | "segment" | "entry";

type DemoBulkActionToolbarProps = {
  kind: BulkSelectionKind;
  count: number;
};

const formatLabel = (kind: BulkSelectionKind, count: number) => {
  const noun = kind === "block" ? "block" : kind === "segment" ? "segment" : "entry";
  const plural = count === 1 ? noun : `${noun}s`;

  return `${count.toString()} ${plural} selected`;
};

const DemoBulkActionToolbar = ({ kind, count }: DemoBulkActionToolbarProps) => {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const isEntries = kind === "entry";
  const isBlocks = kind === "block";
  const isSegments = kind === "segment";

  if (count < 2) {
    return (
      <Typography variant="caption" color="text.secondary">
        Toolbar hidden — selection requires 2+ ids
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        px: 2,
        py: 1,
        boxShadow: 3,
        width: "100%",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip color="primary" label={formatLabel(kind, count)} size="small" />

          {isEntries && (
            <Button variant="contained" size="small" onClick={() => setLastAction("replace")}>
              Replace exercise
            </Button>
          )}
          {isBlocks && (
            <Button variant="outlined" size="small" onClick={() => setLastAction("suspend")}>
              Suspend blocks
            </Button>
          )}
          {isBlocks && (
            <Button variant="outlined" size="small" onClick={() => setLastAction("unsuspend")}>
              Reactivate blocks
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setLastAction("delete")}
          >
            Delete {isEntries ? "entries" : isSegments ? "segments" : "blocks"}
          </Button>
          <Button variant="text" size="small" onClick={() => setLastAction("clone-day")}>
            Clone day
          </Button>
          <Button variant="text" size="small" onClick={() => setLastAction("repeat-weeks")}>
            Repeat weeks
          </Button>
          <Button variant="text" size="small" onClick={() => setLastAction("shift-weeks")}>
            Shift weeks
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Last action: {lastAction ?? "—"}
        </Typography>
      </Stack>
    </Box>
  );
};

const meta = {
  title: "LMS/BulkActionToolbar",
  component: DemoBulkActionToolbar,
  args: { kind: "entry", count: 3 },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DemoBulkActionToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoEntries: Story = { args: { kind: "entry", count: 2 } };
export const FiveEntries: Story = { args: { kind: "entry", count: 5 } };
export const FiftyEntries: Story = { args: { kind: "entry", count: 50 } };
export const TwoBlocks: Story = { args: { kind: "block", count: 2 } };
export const ThreeSegments: Story = { args: { kind: "segment", count: 3 } };

export const SelectionBelowMinimum: Story = { args: { kind: "entry", count: 1 } };

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="2 entries selected" direction="column">
        <DemoBulkActionToolbar kind="entry" count={2} />
      </StorySection>
      <StorySection title="5 entries selected" direction="column">
        <DemoBulkActionToolbar kind="entry" count={5} />
      </StorySection>
      <StorySection title="50 entries selected (URL fallback to sessionStorage)" direction="column">
        <DemoBulkActionToolbar kind="entry" count={50} />
      </StorySection>
      <StorySection title="2 blocks selected — block-only actions" direction="column">
        <DemoBulkActionToolbar kind="block" count={2} />
      </StorySection>
      <StorySection title="3 segments selected" direction="column">
        <DemoBulkActionToolbar kind="segment" count={3} />
      </StorySection>
    </StoryPage>
  ),
};
