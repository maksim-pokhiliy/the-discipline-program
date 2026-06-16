"use client";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { GENDER_LABELS, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";

import { HealthStatusChip } from "@app/lib/components";

import { AthleteEnrollmentChips } from "./athlete-enrollment-chips";
import { type AthleteRowAction, AthleteRowActionsMenu } from "./athlete-row-actions-menu";
import { AthleteSelectAvatar, SELECT_OVERLAY_CLASS } from "./athlete-select-avatar";
import { attentionTone, formatRelativeTime } from "./athletes-roster-config";

const AVATAR_SIZE = 56;
const AVATAR_FONT = 22;
const ATTENTION_BORDER_ALPHA = 0.4;
const HEADER_TINT_ALPHA = 0.01;

const healthNoteColor = (status: HealthStatus): "error" | "warning" | "info" => {
  if (status === HealthStatus.INJURED) {
    return "error";
  }

  if (status === HealthStatus.RESTRICTED) {
    return "warning";
  }

  return "info";
};

type AthletePassportCardProps = {
  athlete: CoachAthleteListItem;
  checked: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onAction: (action: AthleteRowAction) => void;
};

export const AthletePassportCard: React.FC<AthletePassportCardProps> = ({
  athlete,
  checked,
  onToggleSelect,
  onOpen,
  onAction,
}) => {
  const tone = attentionTone(athlete);
  const displayName = athlete.name ?? athlete.email;

  const metaParts = [
    athlete.gender ? GENDER_LABELS[athlete.gender] : null,
    athlete.heightCm ? `${athlete.heightCm} cm` : null,
    athlete.weightKg ? `${athlete.weightKg} kg` : null,
    `Boarded ${formatRelativeTime(athlete.enrolledSince)}`,
  ].filter((part): part is string => part !== null);

  return (
    <Card
      variant="outlined"
      onClick={onOpen}
      sx={(theme) => ({
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: theme.transitions.create("border-color"),
        ...(tone && { borderColor: alpha(theme.palette[tone].main, ATTENTION_BORDER_ALPHA) }),
        ...(checked && { borderColor: theme.palette.primary.main }),
        "&:hover": {
          borderColor: tone ? theme.palette[tone].main : theme.palette.dividerStrong,
        },
        [`&:hover .${SELECT_OVERLAY_CLASS}`]: { opacity: 1, pointerEvents: "auto" },
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 1.5,
          p: 1.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.common.white, HEADER_TINT_ALPHA),
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

        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ wordBreak: "break-word" }}>
            {displayName}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {metaParts.join("  ·  ")}
          </Typography>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 0.25 }}
          >
            <HealthStatusChip healthStatus={athlete.healthStatus} />

            {athlete.openActionItemsCount > 0 && (
              <Chip
                size="small"
                color="error"
                icon={<ErrorOutlineIcon />}
                label={`${athlete.openActionItemsCount} action`}
              />
            )}
          </Stack>
        </Stack>

        <Box onClick={(event) => event.stopPropagation()}>
          <AthleteRowActionsMenu onAction={onAction} />
        </Box>
      </Box>

      <Stack spacing={1.5} sx={{ p: 1.75, flex: 1 }}>
        <Box>
          <Typography variant="overline" color="text.muted" display="block">
            Enrollments · {athlete.enrollments.length}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <AthleteEnrollmentChips enrollments={athlete.enrollments} />
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.muted" display="block">
            Last seen
          </Typography>
          <Typography variant="body2">
            {athlete.lastActivityDate
              ? formatRelativeTime(athlete.lastActivityDate)
              : "No session logged"}
          </Typography>
        </Box>

        {athlete.healthNote && (
          <Box>
            <Typography variant="overline" color="text.muted" display="block">
              Health note
            </Typography>
            <Typography
              variant="body2"
              sx={(theme) => ({
                mt: 0.5,
                pl: 1,
                borderLeft: `2px solid ${theme.palette[healthNoteColor(athlete.healthStatus)].main}`,
              })}
            >
              {athlete.healthNote}
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
};
