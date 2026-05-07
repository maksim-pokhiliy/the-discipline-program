"use client";

import { Alert, Paper, Stack, Typography } from "@mui/material";

import { type PlanBlock } from "@repo/contracts/lms/plan-block";
import { LoadingState } from "@repo/ui";

import { useItemsByBlock } from "@app/lib/hooks";

import { PlanItemRow } from "./plan-item-row";
import { SchemeSummary } from "./scheme-summary";
import { type Lookups } from "./types";

const BLOCK_TYPE_SEPARATOR = " | ";
const DELETED_BLOCK_TYPE_LABEL = "(deleted block type)";
const ITEMS_LOADING_MIN_HEIGHT = "4vh";

type PlanBlockCardProps = { planId: string; block: PlanBlock; lookups: Lookups };

export const PlanBlockCard: React.FC<PlanBlockCardProps> = ({ planId, block, lookups }) => {
  const itemsQuery = useItemsByBlock(planId, block.id);
  const blockTypeLabel = block.blockTypeIds
    .map((id) => lookups.blockTypes.get(id)?.name ?? DELETED_BLOCK_TYPE_LABEL)
    .join(BLOCK_TYPE_SEPARATOR);
  const schemeType = lookups.schemeTypes.get(block.schemeTypeId) ?? null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">{blockTypeLabel}</Typography>
        <SchemeSummary schemeType={schemeType} params={block.schemeParams} />
        {block.notes !== null ? (
          <Typography variant="caption" color="text.secondary">
            {block.notes}
          </Typography>
        ) : null}
        {itemsQuery.isLoading ? (
          <LoadingState message="Loading items..." minHeight={ITEMS_LOADING_MIN_HEIGHT} />
        ) : null}
        {itemsQuery.error ? <Alert severity="error">Failed to load items</Alert> : null}
        {itemsQuery.data ? (
          <Stack spacing={0.5}>
            {itemsQuery.data.items.map((item) => (
              <PlanItemRow key={item.id} item={item} lookups={lookups} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};
