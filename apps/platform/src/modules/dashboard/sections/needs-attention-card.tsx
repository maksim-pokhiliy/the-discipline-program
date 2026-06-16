"use client";

import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";

import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";
import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import { formatTimeAgo } from "@repo/shared";
import { ActionTypeChip, SeverityActionCard, StatusChip, UserChip } from "@repo/ui";

import { getHealthChipFromMessage } from "@app/lib/config";

const CONTACTED_LABEL = "Contacted";

const SEVERITY_LABEL: Record<ActionItemSeverity, { label: string; color: string }> = {
  [ActionItemSeverity.CRITICAL]: { label: "Critical", color: "error.main" },
  [ActionItemSeverity.WARNING]: { label: "Warning", color: "warning.main" },
  [ActionItemSeverity.INFO]: { label: "Info", color: "text.muted" },
};

type NeedsAttentionCardProps = {
  item: DashboardActionItem;
  onOpenAthlete: (athleteId: string) => void;
  onOpenResolve: (item: DashboardActionItem) => void;
  onQuickResolve: (itemId: string) => void;
};

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  item,
  onOpenAthlete,
  onOpenResolve,
  onQuickResolve,
}) => {
  const healthChip = getHealthChipFromMessage(item.message);
  const severity = SEVERITY_LABEL[item.severity];

  return (
    <SeverityActionCard
      severity={item.severity}
      onClick={() => onOpenResolve(item)}
      actions={
        <>
          <Button
            size="small"
            variant="text"
            startIcon={<CheckIcon />}
            onClick={(event) => {
              event.stopPropagation();
              onQuickResolve(item.id);
            }}
          >
            {CONTACTED_LABEL}
          </Button>
          <IconButton
            size="small"
            aria-label="Open athlete"
            onClick={(event) => {
              event.stopPropagation();
              onOpenAthlete(item.athleteId);
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </>
      }
    >
      <UserChip
        user={{ id: item.athleteId, name: item.athleteName, image: item.athleteImage }}
        size="medium"
      />
      <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <ActionTypeChip type={item.type} />
          {healthChip !== null && <StatusChip {...healthChip} />}
        </Stack>
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {item.message}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatTimeAgo(item.createdAt)}
          </Typography>
          <Box component="span" sx={{ color: "text.faint" }}>
            ·
          </Box>
          <Typography variant="caption" sx={{ color: severity.color }}>
            {severity.label}
          </Typography>
        </Stack>
      </Stack>
    </SeverityActionCard>
  );
};
