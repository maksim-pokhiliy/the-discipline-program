import { type ReactElement } from "react";

import LayersRounded from "@mui/icons-material/LayersRounded";
import { alpha, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import { buildLoadLine, buildRowSubLine, buildVolume } from "../utils/athlete-session-presentation";
import {
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_MEDIUM,
  LOAD_AT_PREFIX,
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
  ROW_SUB_PX,
  TRACK_LABEL_LETTER_SPACING,
} from "../utils/athlete-session.constants";

import { DemoLink } from "./demo-link";

const MEMBER_LINE_GAP = " ";

const memberLine = (member: RowView): string => {
  const volume = buildVolume(member);
  const { loadStr, showAt } = buildLoadLine(member.resolvedLoad, member.load);
  const load = showAt && loadStr.length > 0 ? `${LOAD_AT_PREFIX} ${loadStr}` : loadStr;

  return [volume, load].filter((part) => part.length > 0).join(MEMBER_LINE_GAP);
};

export type RowGroupProps = {
  label: string | null;
  members: RowView[];
};

export const RowGroup = ({ label, members }: RowGroupProps): ReactElement => (
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
        {label ?? ROW_GROUP_LABEL}
      </Typography>
    </Stack>

    <Stack spacing={`${ROW_GROUP_MEMBER_GAP_PX}px`}>
      {members.map((member) => {
        const settings = buildRowSubLine(member);

        return (
          <Stack key={member.rowId} spacing={0.25}>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="space-between"
              spacing={1.5}
            >
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
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
                {member.media !== null ? <DemoLink url={member.media} /> : null}
              </Stack>
              <Typography
                component="span"
                sx={(theme) => ({
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  fontSize: theme.typography.pxToRem(ROW_GROUP_LINE_PX),
                  color: theme.palette.text.secondary,
                })}
              >
                {memberLine(member)}
              </Typography>
            </Stack>
            {settings.length > 0 ? (
              <Typography
                component="div"
                sx={(theme) => ({
                  fontSize: theme.typography.pxToRem(ROW_SUB_PX),
                  color: theme.palette.text.muted,
                })}
              >
                {settings}
              </Typography>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  </Stack>
);
