import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlanEditorSaveIndicator } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Feedback/PlanEditorSaveIndicator",
  component: PlanEditorSaveIndicator,
  args: {
    status: "dirty",
  },
} satisfies Meta<typeof PlanEditorSaveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clean: Story = {
  args: {
    status: "clean",
  },
};

export const Dirty: Story = {
  args: {
    status: "dirty",
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

export const ErrorWithoutRetry: Story = {
  args: {
    status: "error",
    errorMessage: "Save failed — validation",
  },
};

export const AllStates: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="clean (renders nothing)" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            clean
          </Typography>
          <PlanEditorSaveIndicator status="clean" />
        </Stack>
      </StorySection>

      <StorySection title="dirty / saving / saved" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            dirty
          </Typography>
          <PlanEditorSaveIndicator status="dirty" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            saving
          </Typography>
          <PlanEditorSaveIndicator status="saving" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            saved
          </Typography>
          <PlanEditorSaveIndicator status="saved" />
        </Stack>
      </StorySection>

      <StorySection title="error (with + without retry)" direction="column">
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            error + retry
          </Typography>
          <PlanEditorSaveIndicator
            status="error"
            errorMessage="Save failed — network error"
            onRetry={() => undefined}
          />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ width: 160 }}>
            error (no retry)
          </Typography>
          <PlanEditorSaveIndicator status="error" errorMessage="Save failed — validation" />
        </Stack>
      </StorySection>
    </StoryPage>
  ),
};
