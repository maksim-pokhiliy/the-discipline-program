"use client";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { IndicatorChip } from "@repo/ui";

import { HealthStatusChip } from "@app/lib/components";

import { AthleteEnrollmentChips } from "./athlete-enrollment-chips";
import { type AthleteRowAction, AthleteRowActionsMenu } from "./athlete-row-actions-menu";
import { AthleteSelectAvatar, SELECT_OVERLAY_CLASS } from "./athlete-select-avatar";
import { attentionTone, formatLastSeenShort, formatRelativeTime } from "./athletes-roster-config";
import { ResendInviteAction } from "./resend-invite-action";

const AVATAR_SIZE = 36;
const AVATAR_FONT = 14;
const ATTENTION_BG_ALPHA = 0.04;
const ATTENTION_BG_HOVER_ALPHA = 0.08;
const SELECTED_BG_ALPHA = 0.08;

type AthleteRosterRowProps = {
  athlete: CoachAthleteListItem;
  checked: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onAction: (action: AthleteRowAction) => void;
};

export const AthleteRosterRow: React.FC<AthleteRosterRowProps> = ({
  athlete,
  checked,
  onToggleSelect,
  onOpen,
  onAction,
}) => {
  const tone = attentionTone(athlete);
  const displayName = athlete.name ?? athlete.email;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onOpen}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 1.5,
        px: 1.75,
        py: 1.5,
        cursor: "pointer",
        borderLeft: "2px solid",
        borderLeftColor: tone ? theme.palette[tone].main : "transparent",
        bgcolor: tone ? alpha(theme.palette[tone].main, ATTENTION_BG_ALPHA) : "transparent",
        transition: theme.transitions.create("background-color"),
        "&:hover": {
          bgcolor: tone
            ? alpha(theme.palette[tone].main, ATTENTION_BG_HOVER_ALPHA)
            : theme.palette.action.hover,
        },
        ...(checked && { bgcolor: alpha(theme.palette.primary.main, SELECTED_BG_ALPHA) }),
        [`&:hover .${SELECT_OVERLAY_CLASS}`]: { opacity: 1, pointerEvents: "auto" },
      })}
    >
      <AthleteSelectAvatar
        name={displayName}
        image={athlete.image}
        size={AVATAR_SIZE}
        fontSize={AVATAR_FONT}
        checked={checked}
        onToggle={onToggleSelect}
      />

      <Stack spacing={1} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle2" noWrap sx={{ minWidth: 0 }}>
            {displayName}
          </Typography>

          <HealthStatusChip healthStatus={athlete.healthStatus} />

          {athlete.openActionItemsCount > 0 && (
            <Chip
              size="small"
              color="error"
              icon={<ErrorOutlineIcon />}
              label={athlete.openActionItemsCount}
            />
          )}

          {athlete.isPending && <IndicatorChip tone="info" label="Invited" dot={false} />}
        </Stack>

        <AthleteEnrollmentChips enrollments={athlete.enrollments} />
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        onClick={(event) => event.stopPropagation()}
      >
        <Tooltip
          title={
            athlete.lastActivityDate
              ? `Last session ${formatRelativeTime(athlete.lastActivityDate)}`
              : "No session logged"
          }
        >
          <Stack
            direction="row"
            spacing={0.25}
            alignItems="center"
            sx={{ color: "text.secondary" }}
          >
            <ScheduleIcon sx={{ fontSize: 13, color: "text.muted" }} />
            <Typography variant="caption" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatLastSeenShort(athlete.lastActivityDate)}
            </Typography>
          </Stack>
        </Tooltip>

        {athlete.isPending && <ResendInviteAction userId={athlete.userId} />}

        <AthleteRowActionsMenu onAction={onAction} />
      </Stack>
    </Box>
  );
};
