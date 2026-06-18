import { type ReactElement } from "react";

import LayersRounded from "@mui/icons-material/LayersRounded";
import { alpha, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import { resolveLoadCell } from "../utils/athlete-session-presentation";
import {
  BODYWEIGHT_LABEL,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_MEDIUM,
  ROW_GROUP_ICON_PX,
  ROW_GROUP_LABEL,
  ROW_GROUP_LABEL_ALPHA,
  ROW_GROUP_LABEL_PX,
  ROW_GROUP_LINE_PX,
  ROW_GROUP_MEMBER_ALPHA,
  ROW_GROUP_MEMBER_GAP_PX,
  ROW_GROUP_MEMBER_PX,
  ROW_GROUP_PADDING_X_PX,
  ROW_GROUP_PADDING_Y_PX,
  TRACK_LABEL_LETTER_SPACING,
} from "../utils/athlete-session.constants";
import { formatRepNotation } from "../utils/format-rep-notation";

const LINE_SEPARATOR = "  ·  ";

const memberLine = (member: RowView): string => {
  const reps = member.reps !== null ? formatRepNotation(member.reps) : "";
  const loadCell = resolveLoadCell(member.resolvedLoad, member.load);

  const load =
    loadCell.state === "resolved"
      ? loadCell.value
      : loadCell.state === "bodyweight"
        ? BODYWEIGHT_LABEL
        : "";

  return [reps, load].filter((part) => part.length > 0).join(LINE_SEPARATOR);
};

export type RowGroupProps = {
  members: RowView[];
};

export const RowGroup = ({ members }: RowGroupProps): ReactElement => (
  <Stack sx={{ px: `${ROW_GROUP_PADDING_X_PX}px`, py: `${ROW_GROUP_PADDING_Y_PX}px` }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={(theme) => ({
        mb: 0.75,
        color: alpha(theme.palette.common.white, ROW_GROUP_LABEL_ALPHA),
      })}
    >
      <LayersRounded sx={{ fontSize: ROW_GROUP_ICON_PX }} />
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(ROW_GROUP_LABEL_PX),
          fontWeight: FONT_WEIGHT_DISPLAY,
          letterSpacing: TRACK_LABEL_LETTER_SPACING,
          textTransform: "uppercase",
        })}
      >
        {ROW_GROUP_LABEL}
      </Typography>
    </Stack>

    <Stack spacing={`${ROW_GROUP_MEMBER_GAP_PX}px`}>
      {members.map((member) => (
        <Stack
          key={member.rowId}
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
          spacing={1.5}
        >
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(ROW_GROUP_MEMBER_PX),
              fontWeight: FONT_WEIGHT_MEDIUM,
              color: alpha(theme.palette.common.white, ROW_GROUP_MEMBER_ALPHA),
            })}
          >
            {member.movement}
          </Typography>
          <Typography
            component="span"
            sx={(theme) => ({
              flexShrink: 0,
              fontSize: theme.typography.pxToRem(ROW_GROUP_LINE_PX),
              color: theme.palette.text.secondary,
            })}
          >
            {memberLine(member)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </Stack>
);
