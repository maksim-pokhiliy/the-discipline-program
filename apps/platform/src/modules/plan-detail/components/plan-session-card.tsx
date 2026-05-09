"use client";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Alert, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";

import { type PlanSession } from "@repo/contracts/lms/plan-session";
import { LoadingState } from "@repo/ui";

import { useBlocksBySession } from "@app/lib/hooks";

import { PlanBlockCard } from "./plan-block-card";
import { type Lookups } from "./types";

const BLOCKS_LOADING_MIN_HEIGHT = "5vh";
const CARD_ACTION_CLASS = "CardHoverAction";
const CARD_ACTION_TRANSITION = "opacity 0.15s ease";

const cardActionSx = {
  opacity: 0,
  transition: CARD_ACTION_TRANSITION,
  "&:focus-visible": { opacity: 1 },
} as const;

type PlanSessionCardProps = {
  planId: string;
  session: PlanSession;
  lookups: Lookups;
  onEditSession: (dayId: string, sessionId: string) => void;
  onAddBlock: (sessionId: string) => void;
  onEditBlock: (sessionId: string, blockId: string) => void;
};

export const PlanSessionCard: React.FC<PlanSessionCardProps> = ({
  planId,
  session,
  lookups,
  onEditSession,
  onAddBlock,
  onEditBlock,
}) => {
  const blocksQuery = useBlocksBySession(planId, session.id);
  const sessionTitle = session.label ?? `Session ${session.order + 1}`;
  const blocks = blocksQuery.data?.blocks ?? [];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        [`&:hover .${CARD_ACTION_CLASS}`]: { opacity: 1 },
      }}
    >
      <Stack spacing={2} justifyContent="center" sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">{sessionTitle}</Typography>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit session">
              <IconButton
                className={CARD_ACTION_CLASS}
                aria-label="Edit session"
                onClick={() => onEditSession(session.dayId, session.id)}
                sx={cardActionSx}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add block">
              <IconButton
                className={CARD_ACTION_CLASS}
                aria-label="Add block"
                onClick={() => onAddBlock(session.id)}
                sx={{ ...cardActionSx, color: "primary.main" }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {Boolean(blocksQuery.isLoading || blocksQuery.error || blocks.length > 0) && (
          <Stack spacing={2}>
            {blocksQuery.isLoading && (
              <LoadingState message="Loading blocks..." minHeight={BLOCKS_LOADING_MIN_HEIGHT} />
            )}

            {blocksQuery.error !== null && <Alert severity="error">Failed to load blocks</Alert>}

            {blocks.length > 0 && (
              <Stack spacing={1}>
                {blocks.map((block) => (
                  <PlanBlockCard
                    key={block.id}
                    planId={planId}
                    block={block}
                    lookups={lookups}
                    onEditBlock={onEditBlock}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
