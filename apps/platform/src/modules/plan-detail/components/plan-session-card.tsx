"use client";

import { Alert, Paper, Stack, Typography } from "@mui/material";

import { type PlanSession } from "@repo/contracts/lms/plan-session";
import { LoadingState } from "@repo/ui";

import { useBlocksBySession } from "@app/lib/hooks";

import { PlanBlockCard } from "./plan-block-card";
import { type Lookups } from "./types";

const BLOCKS_LOADING_MIN_HEIGHT = "5vh";

type PlanSessionCardProps = { planId: string; session: PlanSession; lookups: Lookups };

export const PlanSessionCard: React.FC<PlanSessionCardProps> = ({ planId, session, lookups }) => {
  const blocksQuery = useBlocksBySession(planId, session.id);
  const sessionTitle = session.label ?? `Session ${session.order + 1}`;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">{sessionTitle}</Typography>
        {blocksQuery.isLoading ? (
          <LoadingState message="Loading blocks..." minHeight={BLOCKS_LOADING_MIN_HEIGHT} />
        ) : null}
        {blocksQuery.error ? <Alert severity="error">Failed to load blocks</Alert> : null}
        {blocksQuery.data ? (
          <Stack spacing={1}>
            {blocksQuery.data.blocks.map((block) => (
              <PlanBlockCard key={block.id} planId={planId} block={block} lookups={lookups} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};
