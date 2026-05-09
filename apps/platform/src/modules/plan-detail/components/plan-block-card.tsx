"use client";

import EditIcon from "@mui/icons-material/Edit";
import { Alert, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";

import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { LoadingState } from "@repo/ui";

import { useItemsByBlock } from "@app/lib/hooks";

import { PlanItemRow } from "./plan-item-row";
import { SchemeSummary } from "./scheme-summary";
import { type Lookups } from "./types";

const BLOCK_TYPE_SEPARATOR = " | ";
const DELETED_BLOCK_TYPE_LABEL = "(deleted block type)";
const ITEMS_LOADING_MIN_HEIGHT = "4vh";
const CARD_ACTION_CLASS = "CardHoverAction";
const CARD_ACTION_TRANSITION = "opacity 0.15s ease";

const cardActionSx = {
  opacity: 0,
  transition: CARD_ACTION_TRANSITION,
  "&:focus-visible": { opacity: 1 },
} as const;

type PlanBlockCardProps = {
  planId: string;
  block: PlanBlock;
  lookups: Lookups;
  onEditBlock: (sessionId: string, blockId: string) => void;
};

export const PlanBlockCard: React.FC<PlanBlockCardProps> = ({
  planId,
  block,
  lookups,
  onEditBlock,
}) => {
  const itemsQuery = useItemsByBlock(planId, block.id);
  const blockTypeLabel = block.blockTypeIds
    .map((id) => lookups.blockTypes.get(id)?.name ?? DELETED_BLOCK_TYPE_LABEL)
    .join(BLOCK_TYPE_SEPARATOR);
  const schemeType = lookups.schemeTypes.get(block.schemeTypeId) ?? null;
  const items = itemsQuery.data?.items ?? [];

  const handleEdit = (): void => onEditBlock(block.sessionId, block.id);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        position: "relative",
        [`&:hover .${CARD_ACTION_CLASS}`]: { opacity: 1 },
      }}
    >
      <Tooltip title="Edit block">
        <IconButton
          className={CARD_ACTION_CLASS}
          size="small"
          aria-label="Edit block"
          onClick={handleEdit}
          sx={{ position: "absolute", top: 8, right: 8, ...cardActionSx }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Stack spacing={1}>
        <Typography variant="subtitle2">{blockTypeLabel}</Typography>
        <SchemeSummary schemeType={schemeType} params={block.schemeParams} />
        {block.notes !== null && (
          <Typography variant="caption" color="text.secondary">
            {block.notes}
          </Typography>
        )}
        {itemsQuery.isLoading && (
          <LoadingState message="Loading items..." minHeight={ITEMS_LOADING_MIN_HEIGHT} />
        )}
        {itemsQuery.error !== null && <Alert severity="error">Failed to load items</Alert>}
        {items.length > 0 && (
          <Stack spacing={0.5}>
            {items.map((item) => (
              <PlanItemRow key={item.id} item={item} lookups={lookups} />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
