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

type Draft = {
  label: string;
};

const draftSchema = z.object({
  label: z.string().min(1, "Label is required"),
});

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type SegmentCardProps = {
  segmentId: string;
  initial: Draft;
};

const SegmentCard = ({ segmentId, initial }: SegmentCardProps) => {
  const session = useEditSession<Draft>({
    sessionId: segmentId,
    initial,
    expectedVersion: 1,
    label: `Segment ${segmentId}`,
    validate: (draft) => draftSchema.safeParse(draft),
    mutationKey: ["multi-card-cmd-s", segmentId],
    mutationFn: async (draft) => {
      await fetch(`/api/platform/segments/${segmentId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...draft, expectedVersion: 1 }),
      });
      await wait(50);

      return draft;
    },
    idleSaveMs: 600_000,
  });

  return (
    <Card data-edit-session-id={segmentId} data-segment-id={segmentId} sx={{ width: 320 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Segment {segmentId}</Typography>
            <SaveIndicator
              status={session.status}
              lastSavedAt={session.lastSavedAt}
              conflict={session.conflict}
              errorMessage={session.error?.message}
              onRetry={() => {
                void session.save();
              }}
              onReload={() => {
                session.reset(initial, 1);
              }}
            />
          </Stack>
          <TextField
            size="small"
            label="Label"
            value={session.draft.label}
            onChange={(event) => session.dispatch({ ...session.draft, label: event.target.value })}
            slotProps={{ htmlInput: { "data-testid": `label-${segmentId}` } }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              void session.save();
            }}
            disabled={!session.isDirty || !session.isValid || session.isSaving}
          >
            Save
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const RouteChangeButton = () => {
  const orchestrator = useEditSessionOrchestrator();

  return (
    <Button
      data-testid="library-link"
      variant="text"
      onClick={() => {
        if (!orchestrator) {
          return;
        }

        void orchestrator.requestRouteChangeFlush();
      }}
    >
      Library
    </Button>
  );
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const Shell = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <EditSessionProvider>
      <Box sx={{ p: 4 }}>{children}</Box>
    </EditSessionProvider>
  </QueryClientProvider>
);

const meta = {
  title: "Edit Session/Multi-card Cmd+S",
  component: SegmentCard,
  args: {
    segmentId: "card-1",
    initial: { label: "Squat" },
  },
} satisfies Meta<typeof SegmentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeCardsFocusedCmdS: Story = {
  render: () => (
    <Shell>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <SegmentCard segmentId="card-1" initial={{ label: "Squat" }} />
          <SegmentCard segmentId="card-2" initial={{ label: "Press" }} />
          <SegmentCard segmentId="card-3" initial={{ label: "Pull" }} />
        </Stack>
        <RouteChangeButton />
      </Stack>
    </Shell>
  ),
};
