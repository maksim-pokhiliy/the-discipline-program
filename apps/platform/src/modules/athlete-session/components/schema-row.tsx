import { type ReactElement } from "react";

import StickyNote2Rounded from "@mui/icons-material/StickyNote2Rounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import { buildRowSubLine, buildVolume } from "../utils/athlete-session-presentation";
import {
  FONT_WEIGHT_SEMI_BOLD,
  LOAD_AT_PREFIX,
  ROW_AT_ALPHA,
  ROW_AT_PX,
  ROW_MOVEMENT_ALPHA,
  ROW_MOVEMENT_PX,
  ROW_NOTE_ALPHA,
  ROW_NOTE_ICON_PX,
  ROW_NOTE_PX,
  ROW_PADDING_X_PX,
  ROW_PADDING_Y_PX,
  ROW_SUB_PX,
  ROW_VOLUME_ALPHA,
  ROW_VOLUME_PX,
} from "../utils/athlete-session.constants";
import { buildLoadCell, hasLoadValue } from "../utils/load-cell";
import { type SessionEditorControls } from "../utils/use-session-logging";

import { DemoLink } from "./demo-link";
import { LoadCell } from "./load-cell";

const NOTE_SEPARATOR = " ";

export type SchemaRowProps = {
  row: RowView;
  editor: SessionEditorControls;
};

export const SchemaRow = ({ row, editor }: SchemaRowProps): ReactElement => {
  const volume = buildVolume(row);
  const cell = buildLoadCell(row);
  const subLine = buildRowSubLine(row);
  const noteText = row.notes !== null ? row.notes.join(NOTE_SEPARATOR) : "";
  const hasLoad = hasLoadValue(cell);

  return (
    <Box sx={{ px: `${ROW_PADDING_X_PX}px`, py: `${ROW_PADDING_Y_PX}px` }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="flex-end"
        spacing={1.75}
        sx={{ flexWrap: "wrap", minWidth: 0 }}
      >
        <Stack
          direction="row"
          alignItems="baseline"
          spacing={0.75}
          sx={{ flex: "1 1 auto", minWidth: 0 }}
        >
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(ROW_MOVEMENT_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              color: alpha(theme.palette.common.white, ROW_MOVEMENT_ALPHA),
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {row.movement}
          </Typography>
          {row.media !== null ? <DemoLink url={row.media} /> : null}
        </Stack>

        <Stack
          direction="row"
          alignItems="baseline"
          spacing={0.75}
          sx={{ flex: "0 1 auto", minWidth: 0, flexWrap: "wrap", justifyContent: "flex-end" }}
        >
          {volume.length > 0 ? (
            <Box
              component="span"
              sx={(theme) => ({
                fontFamily: theme.typography.h4.fontFamily,
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                fontSize: theme.typography.pxToRem(ROW_VOLUME_PX),
                lineHeight: 1,
                color: alpha(theme.palette.common.white, ROW_VOLUME_ALPHA),
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
            cell={cell}
            isPulsing={editor.pulsingRowIds.has(row.rowId)}
            onOpen={(target) => editor.openWeightSheet(row, target)}
          />
        </Stack>
      </Stack>

      {subLine.length > 0 ? (
        <Typography
          component="div"
          sx={(theme) => ({
            mt: 0.5,
            fontSize: theme.typography.pxToRem(ROW_SUB_PX),
            color: theme.palette.text.muted,
          })}
        >
          {subLine}
        </Typography>
      ) : null}

      {noteText.length > 0 ? (
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={0.625}
          sx={(theme) => ({ mt: 0.5, color: alpha(theme.palette.common.white, ROW_NOTE_ALPHA) })}
        >
          <StickyNote2Rounded sx={{ mt: "1px", fontSize: ROW_NOTE_ICON_PX }} />
          <Typography
            component="span"
            sx={(theme) => ({ fontSize: theme.typography.pxToRem(ROW_NOTE_PX) })}
          >
            {noteText}
          </Typography>
        </Stack>
      ) : null}
    </Box>
  );
};
