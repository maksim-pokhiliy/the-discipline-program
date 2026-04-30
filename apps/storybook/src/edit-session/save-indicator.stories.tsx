import { useRef } from "react";

import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { z } from "zod";

import {
  EditSessionProvider,
  SaveIndicator,
  useEditSession,
  useEditSessionOrchestrator,
} from "@repo/ui";

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

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type RetryDraft = { note: string };

const retryDraftSchema = z.object({
  note: z.string().min(1, "Note is required"),
});

const retryQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const RetryFlowCard = () => {
  const attemptRef = useRef(0);
  const orchestrator = useEditSessionOrchestrator();

  const session = useEditSession<RetryDraft>({
    sessionId: "error-retry-demo",
    initial: { note: "Squat 5×5 @ 80%" },
    expectedVersion: 1,
    label: "Error → Retry Demo",
    validate: (draft) => retryDraftSchema.safeParse(draft),
    mutationKey: ["story-retry-flow"],
    mutationFn: async (draft) => {
      await wait(500);
      attemptRef.current += 1;

      if (attemptRef.current === 1) {
        throw new Error("Network error — connection timed out");
      }

      return draft;
    },
    idleSaveMs: 2_000,
    savedFadeMs: 4_000,
  });

  return (
    <Card data-edit-session-id="error-retry-demo" sx={{ width: 400 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Error → Retry Flow</Typography>
            <SaveIndicator
              status={session.status}
              lastSavedAt={session.lastSavedAt}
              errorMessage={session.error?.message}
              onRetry={() => {
                void orchestrator?.flushSession("error-retry-demo");
              }}
            />
          </Stack>
          <TextField
            size="small"
            label="Note"
            value={session.draft.note}
            onChange={(event) => session.dispatch({ ...session.draft, note: event.target.value })}
            helperText="Edit the note — auto-saves in 2s (first save fails, retry succeeds)"
          />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                void session.save();
              }}
              disabled={!session.isDirty || !session.isValid || session.isSaving}
            >
              Save now
            </Button>
            <Button
              size="small"
              variant="text"
              color="warning"
              onClick={() => {
                attemptRef.current = 0;
                session.reset({ note: "Squat 5×5 @ 80%" }, 1);
              }}
            >
              Reset demo
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export const ErrorRetryFlow: Story = {
  render: () => (
    <QueryClientProvider client={retryQueryClient}>
      <EditSessionProvider>
        <Box sx={{ p: 4 }}>
          <StoryPage>
            <StorySection title="error → retry → saved lifecycle" direction="column">
              <Typography variant="body2" color="text.secondary">
                Edit the note field. The indicator enters dirty → saving → error (first attempt
                always fails). Click Retry to trigger the second save attempt which succeeds.
              </Typography>
              <RetryFlowCard />
            </StorySection>
          </StoryPage>
        </Box>
      </EditSessionProvider>
    </QueryClientProvider>
  ),
};
