import { type ReactElement } from "react";

import LayersRounded from "@mui/icons-material/LayersRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import { buildRowSubLine, buildVolume } from "../utils/athlete-session-presentation";
import {
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_MEDIUM,
  LOAD_AT_PREFIX,
  ROW_AT_ALPHA,
  ROW_AT_PX,
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
import { buildLoadCell } from "../utils/load-cell";
import { type SessionEditorControls } from "../utils/use-session-logging";

import { DemoLink } from "./demo-link";
import { LoadCell } from "./load-cell";

export type RowGroupProps = {
  label: string | null;
  members: RowView[];
  editor: SessionEditorControls;
};

export const RowGroup = ({ label, members, editor }: RowGroupProps): ReactElement => (
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
        const volume = buildVolume(member);
        const cell = buildLoadCell(member);
        const hasLoad = cell.kind !== "empty" && cell.value.length > 0;

        return (
          <Stack key={member.rowId} spacing={0.25}>
            <Stack
              direction="row"
              alignItems="baseline"
              justifyContent="flex-end"
              spacing={1.5}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{ flex: "1 1 auto", minWidth: 0 }}
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
                {member.media !== null ? <DemoLink url={member.media} /> : null}
              </Stack>
              <Stack
                direction="row"
                alignItems="baseline"
                spacing={0.75}
                useFlexGap
                sx={{ flexWrap: "wrap", minWidth: 0, overflowWrap: "anywhere" }}
              >
                {volume.length > 0 ? (
                  <Box
                    component="span"
                    sx={(theme) => ({
                      fontSize: theme.typography.pxToRem(ROW_GROUP_LINE_PX),
                      color: theme.palette.text.secondary,
                    })}
                  >
                    {volume}
                  </Box>
                ) : null}
                {hasLoad ? (
                  <Box
                    component="span"
                    sx={(theme) => ({
                      fontSize: theme.typography.pxToRem(ROW_AT_PX),
                      color: alpha(theme.palette.common.white, ROW_AT_ALPHA),
                    })}
                  >
                    {LOAD_AT_PREFIX}
                  </Box>
                ) : null}
                <LoadCell
                  row={member}
                  isPulsing={editor.pulsingRowIds.has(member.rowId)}
                  onOpen={(target) => editor.openWeightSheet(member, target)}
                />
              </Stack>
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
