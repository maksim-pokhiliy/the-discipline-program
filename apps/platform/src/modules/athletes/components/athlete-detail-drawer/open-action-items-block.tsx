"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Button, Stack, Typography } from "@mui/material";

import type { AthleteActionItem } from "@repo/contracts/coaching/coach-athletes";
import { formatTimeAgo } from "@repo/shared";
import { ActionTypeChip, SectionHead, SeverityActionCard } from "@repo/ui";

import { useResolveActionItem } from "@app/lib/hooks";

type OpenActionItemsBlockProps = {
  athleteId: string;
  actionItems: AthleteActionItem[];
};

export const OpenActionItemsBlock: React.FC<OpenActionItemsBlockProps> = ({
  athleteId,
  actionItems,
}) => {
  const resolveActionItem = useResolveActionItem();

  if (actionItems.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <SectionHead title="Open action items" count={actionItems.length} />

      {actionItems.map((item) => (
        <SeverityActionCard
          key={item.id}
          severity={item.severity}
          actions={
            <Button
              size="tiny"
              variant="text"
              startIcon={<CheckIcon />}
              disabled={resolveActionItem.isPending}
              onClick={() => resolveActionItem.mutate({ itemId: item.id, athleteId })}
            >
              Resolve
            </Button>
          }
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ActionTypeChip type={item.type} />
              <Typography variant="overline" sx={{ color: "text.faint" }}>
                {formatTimeAgo(item.createdAt)}
              </Typography>
            </Stack>
            <Typography variant="body2">{item.message}</Typography>
          </Stack>
        </SeverityActionCard>
      ))}
    </Stack>
  );
};
