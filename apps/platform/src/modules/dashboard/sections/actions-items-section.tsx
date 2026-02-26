"use client";

import { useState } from "react";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Button,
  Stack,
  Typography,
} from "@mui/material";

import type { DashboardActionItem } from "@repo/contracts/coach-dashboard";

import { useResolveActionItem } from "@app/lib/hooks";

import { ActionItemAlert } from "../components";

const INITIAL_VISIBLE_COUNT = 5;

type ActionItemsSectionProps = {
  items: DashboardActionItem[];
};

export const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({ items }) => {
  const resolveMutation = useResolveActionItem();

  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) {
    return (
      <Stack spacing={1} alignItems="center" py={4}>
        <CheckCircleOutlineIcon color="success" fontSize="large" />

        <Typography variant="body2" color="text.secondary">
          All clear — no issues right now
        </Typography>
      </Stack>
    );
  }

  const visibleItems = showAll ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = items.length - INITIAL_VISIBLE_COUNT;

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography variant="h6">Needs Attention</Typography>

          <Badge color="error" badgeContent={items.length} />
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={2}>
          {visibleItems.map((item) => (
            <ActionItemAlert
              key={item.id}
              item={item}
              onResolve={resolveMutation.mutate}
              isResolving={resolveMutation.isPending && resolveMutation.variables === item.id}
            />
          ))}

          {!showAll && remainingCount > 0 && (
            <Button variant="contained" onClick={() => setShowAll(true)}>
              Show all ({remainingCount} more)
            </Button>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
