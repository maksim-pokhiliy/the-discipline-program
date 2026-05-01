import { useState } from "react";

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

type Draft = {
  title: string;
  reps: number;
  version?: number | undefined;
};

const draftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  reps: z.number().int().min(1, "Reps must be ≥ 1"),
  version: z.number().optional(),
});

type DemoCardProps = {
  sessionId: string;
  initial: Draft;
  label: string;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const DemoCard = ({ sessionId, initial, label }: DemoCardProps) => {
  const session = useEditSession<Draft>({
    sessionId,
    initial,
    expectedVersion: 1,
    label,
    validate: (draft) => draftSchema.safeParse(draft),
    mutationKey: ["story-card", sessionId],
    mutationFn: async (draft, version) => {
      await wait(500);

      return { ...draft, version: version + 1 };
    },
    idleSaveMs: 8_000,
  });

  return (
    <Card data-edit-session-id={sessionId} sx={{ width: 360 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">{label}</Typography>
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
            label="Title"
            value={session.draft.title}
            onChange={(event) => session.dispatch({ ...session.draft, title: event.target.value })}
          />
          <TextField
            size="small"
            label="Reps"
            type="number"
            value={session.draft.reps}
            onChange={(event) =>
              session.dispatch({
                ...session.draft,
                reps: Number(event.target.value || 0),
              })
            }
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
              Save
            </Button>
            <Button
              size="small"
              variant="text"
              color="warning"
              onClick={() => session.discard()}
              disabled={!session.isDirty}
            >
              Discard
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const RouteChangeDemoButton = () => {
  const orchestrator = useEditSessionOrchestrator();
  const [lastResult, setLastResult] = useState<string>("—");

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button
        variant="outlined"
        onClick={async () => {
          if (!orchestrator) {
            return;
          }

          const result = await orchestrator.requestRouteChangeFlush();

          setLastResult(result);
        }}
      >
        Simulate route change
      </Button>
      <Typography variant="caption" color="text.secondary">
        last result: {lastResult}
      </Typography>
    </Stack>
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
  title: "Edit Session/useEditSession Demo",
  component: DemoCard,
  args: {
    sessionId: "demo",
    initial: { title: "Squat", reps: 5 },
    label: "Demo card",
  },
} satisfies Meta<typeof DemoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {
  render: () => (
    <Shell>
      <DemoCard sessionId="demo-1" initial={{ title: "Squat", reps: 5 }} label="Demo card" />
    </Shell>
  ),
};

export const TwoCardsWithRouteChange: Story = {
  render: () => (
    <Shell>
      <StoryPage>
        <StorySection title="open cards (Cmd+S targets focused)">
          <DemoCard sessionId="card-a" initial={{ title: "Squat", reps: 5 }} label="Block A" />
          <DemoCard sessionId="card-b" initial={{ title: "Press", reps: 8 }} label="Block B" />
        </StorySection>
        <StorySection title="route change">
          <RouteChangeDemoButton />
        </StorySection>
      </StoryPage>
    </Shell>
  ),
};
