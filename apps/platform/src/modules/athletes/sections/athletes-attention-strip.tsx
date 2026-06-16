"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { Avatar, AvatarGroup, Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";

import { athleteNeedsAttention, attentionBreakdown } from "../components/athletes-roster-config";

const MAX_AVATARS = 6;
const ICON_BOX = 36;
const ICON_TINT_ALPHA = 0.18;
const BORDER_ALPHA = 0.3;
const BORDER_HOVER_ALPHA = 0.55;
const HOVER_BG_ALPHA = 0.04;
const AVATAR_SIZE = 28;
const AVATAR_FONT = 11;

type AthletesAttentionStripProps = {
  athletes: CoachAthleteListItem[];
  onReview: () => void;
  onOpenAthlete: (userId: string) => void;
};

export const AthletesAttentionStrip: React.FC<AthletesAttentionStripProps> = ({
  athletes,
  onReview,
  onOpenAthlete,
}) => {
  const attention = athletes.filter(athleteNeedsAttention);
  const clean = attention.length === 0;
  const tone = clean ? "success" : "error";

  const breakdown = attentionBreakdown(attention);
  const summary = [
    breakdown.health > 0 ? `${breakdown.health} injured` : null,
    breakdown.actionItems > 0 ? `${breakdown.actionItems} open items` : null,
    breakdown.inactive > 0 ? `${breakdown.inactive} inactive 7d+` : null,
  ]
    .filter((part): part is string => part !== null)
    .join("  ·  ");

  const previews = attention.slice(0, MAX_AVATARS);

  return (
    <Box
      {...(!clean && { role: "button", tabIndex: 0, onClick: onReview })}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.75,
        py: 1.25,
        borderRadius: 1,
        bgcolor: "background.paper",
        border: `1px solid ${alpha(theme.palette[tone].main, BORDER_ALPHA)}`,
        borderLeft: `3px solid ${theme.palette[tone].main}`,
        ...(!clean && {
          cursor: "pointer",
          transition: theme.transitions.create(["border-color", "background-color"]),
          "&:hover": {
            borderColor: alpha(theme.palette.error.main, BORDER_HOVER_ALPHA),
            bgcolor: alpha(theme.palette.error.main, HOVER_BG_ALPHA),
          },
        }),
      })}
    >
      <Box
        sx={(theme) => ({
          width: ICON_BOX,
          height: ICON_BOX,
          borderRadius: 1,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette[tone].main,
          bgcolor: alpha(theme.palette[tone].main, ICON_TINT_ALPHA),
        })}
      >
        {clean ? (
          <CheckCircleOutlineIcon fontSize="small" />
        ) : (
          <PriorityHighIcon fontSize="small" />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {clean ? (
          <>
            <Typography variant="subtitle2">No athletes need attention.</Typography>
            <Typography variant="caption" color="text.secondary">
              All health and engagement signals clear.
            </Typography>
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography variant="h4" color="error.main" component="span">
                {attention.length}
              </Typography>
              <Typography variant="overline" color="text.primary" component="span">
                athletes need attention
              </Typography>
            </Box>
            {summary && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {summary}
              </Typography>
            )}
          </>
        )}
      </Box>

      {!clean && (
        <Box
          onClick={(event) => event.stopPropagation()}
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          <AvatarGroup
            max={MAX_AVATARS}
            total={attention.length}
            sx={{
              "& .MuiAvatar-root": {
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                fontSize: AVATAR_FONT,
                cursor: "pointer",
              },
            }}
          >
            {previews.map((athlete) => (
              <Avatar
                key={athlete.userId}
                {...(athlete.image && { src: athlete.image })}
                alt={athlete.name ?? athlete.email}
                onClick={() => onOpenAthlete(athlete.userId)}
              >
                {(athlete.name ?? athlete.email).charAt(0).toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
        </Box>
      )}

      {!clean && (
        <Button
          size="small"
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={(event) => {
            event.stopPropagation();
            onReview();
          }}
        >
          Review
        </Button>
      )}
    </Box>
  );
};
