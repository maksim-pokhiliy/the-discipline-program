"use client";

import { Alert, Paper, Skeleton, Stack, Typography } from "@mui/material";

import { type PlanSession } from "@repo/contracts/lms/plan-session";

import { useBlocksBySession } from "@app/lib/hooks";

import { PlanBlockCard } from "./plan-block-card";
import { type Lookups } from "./types";

const BLOCKS_SKELETON_HEIGHT_PX = 80;

type PlanSessionCardProps = { planId: string; session: PlanSession; lookups: Lookups };

export const PlanSessionCard: React.FC<PlanSessionCardProps> = ({ planId, session, lookups }) => {
  const blocksQuery = useBlocksBySession(planId, session.id);
  const sessionTitle = session.label ?? `Session ${session.order + 1}`;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">{sessionTitle}</Typography>
        {blocksQuery.isLoading ? (
          <Skeleton variant="rectangular" height={BLOCKS_SKELETON_HEIGHT_PX} />
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
