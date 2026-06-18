import { type ReactElement } from "react";

import StickyNote2Rounded from "@mui/icons-material/StickyNote2Rounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import { buildRowSubLine } from "../utils/athlete-session-presentation";
import {
  FONT_WEIGHT_MEDIUM,
  ROW_GAP_PX,
  ROW_MOVEMENT_ALPHA,
  ROW_MOVEMENT_PX,
  ROW_NOTE_ALPHA,
  ROW_NOTE_ICON_PX,
  ROW_NOTE_PX,
  ROW_PADDING_X_PX,
  ROW_PADDING_Y_PX,
  ROW_REPS_PX,
  ROW_SUB_PX,
} from "../utils/athlete-session.constants";
import { formatRepNotation } from "../utils/format-rep-notation";

import { DisplayNumber } from "./display-number";
import { LoadCell } from "./load-cell";

const NOTE_SEPARATOR = " ";

export type SchemaRowProps = {
  row: RowView;
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
};

export const SchemaRow = ({ row, onSetOneRm, onPickProfile }: SchemaRowProps): ReactElement => {
  const repsText = row.reps !== null ? formatRepNotation(row.reps) : "";
  const subLine = buildRowSubLine(row);
  const noteText = row.notes !== null ? row.notes.join(NOTE_SEPARATOR) : "";

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      sx={{ gap: `${ROW_GAP_PX}px`, px: `${ROW_PADDING_X_PX}px`, py: `${ROW_PADDING_Y_PX}px` }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          {repsText.length > 0 ? <DisplayNumber value={repsText} px={ROW_REPS_PX} /> : null}
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(ROW_MOVEMENT_PX),
              fontWeight: FONT_WEIGHT_MEDIUM,
              color: alpha(theme.palette.common.white, ROW_MOVEMENT_ALPHA),
            })}
          >
            {row.movement}
          </Typography>
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
            sx={(theme) => ({
              mt: 0.5,
              color: alpha(theme.palette.common.white, ROW_NOTE_ALPHA),
            })}
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

      <LoadCell
        rowId={row.rowId}
        resolvedLoad={row.resolvedLoad}
        load={row.load}
        onSetOneRm={onSetOneRm}
        onPickProfile={onPickProfile}
      />
    </Stack>
  );
};
