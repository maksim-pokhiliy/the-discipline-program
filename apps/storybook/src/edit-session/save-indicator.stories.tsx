import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SaveIndicator } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Edit Session/SaveIndicator",
  component: SaveIndicator,
  args: {
    status: "idle",
  },
} satisfies Meta<typeof SaveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: "idle",
    lastSavedAt: new Date(Date.now() - 12_000),
  },
};

export const Dirty: Story = {
  args: {
    status: "dirty",
  },
};

export const DirtyInvalid: Story = {
  args: {
    status: "dirty-invalid",
    validationMessage: "reps is required when load is set",
  },
};

export const Saving: Story = {
  args: {
    status: "saving",
  },
};

export const Saved: Story = {
  args: {
    status: "saved",
  },
};

export const ErrorState: Story = {
  args: {
    status: "error",
    errorMessage: "Save failed — network error",
    onRetry: () => undefined,
  },
};

export const Conflict: Story = {
  args: {
    status: "conflict",
    conflict: { currentVersion: 14 },
    onReload: () => undefined,
  },
};

export const AllStates: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="idle / dirty / dirty-invalid" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            idle
          </Typography>
          <SaveIndicator status="idle" lastSavedAt={new Date(Date.now() - 8_000)} />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            dirty
          </Typography>
          <SaveIndicator status="dirty" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            dirty-invalid
          </Typography>
          <SaveIndicator status="dirty-invalid" validationMessage="reps is required" />
        </Stack>
      </StorySection>

      <StorySection title="saving / saved" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            saving
          </Typography>
          <SaveIndicator status="saving" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            saved
          </Typography>
          <SaveIndicator status="saved" />
        </Stack>
      </StorySection>

      <StorySection title="error / conflict" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            error
          </Typography>
          <SaveIndicator status="error" errorMessage="Save failed" onRetry={() => undefined} />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 120 }}>
            conflict
          </Typography>
          <SaveIndicator
            status="conflict"
            conflict={{ currentVersion: 9 }}
            onReload={() => undefined}
          />
        </Stack>
      </StorySection>
    </StoryPage>
  ),
};
