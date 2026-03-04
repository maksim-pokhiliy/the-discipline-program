"use client";

import { useState } from "react";

import { Button, Chip, Collapse, Divider, Paper, Stack, Typography } from "@mui/material";

import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";

import { useResolveActionItem } from "@app/lib/hooks";

import { AthleteCard } from "../components";
import { ActionMenu } from "../components/action-menu";

import { INITIAL_VISIBLE_COUNT, getChip, getSeverityColor } from "./action-items-config";

type ActionItemsSectionProps = {
  items: DashboardActionItem[];
};

export const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({ items }) => {
  const resolveMutation = useResolveActionItem();

  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const firstItems = items.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenItems = items.slice(INITIAL_VISIBLE_COUNT);

  const renderItem = (item: DashboardActionItem) => {
    const chip = getChip(item);
    const isResolving = resolveMutation.isPending && resolveMutation.variables === item.id;

    return (
      <AthleteCard
        key={item.id}
        name={item.athleteName ?? "Unknown"}
        image={item.athleteImage}
        severity={getSeverityColor(item.severity)}
        message={item.message}
        chips={[chip]}
        action={
          <ActionMenu
            itemId={item.id}
            href={item.href}
            onResolve={resolveMutation.mutate}
            isResolving={isResolving}
          />
        }
      />
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="h6">Needs Attention</Typography>
          <Chip size="small" label={items.length} color="error" />
        </Stack>

        <Divider />

        <Stack spacing={2}>
          {firstItems.map(renderItem)}

          <Collapse in={showAll}>
            <Stack spacing={2}>{hiddenItems.map(renderItem)}</Stack>
          </Collapse>
        </Stack>

        {hiddenItems.length > 0 && (
          <Button variant="outlined" onClick={() => setShowAll((prev) => !prev)}>
            {showAll ? "Show less" : `Show ${hiddenItems.length} more`}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};
