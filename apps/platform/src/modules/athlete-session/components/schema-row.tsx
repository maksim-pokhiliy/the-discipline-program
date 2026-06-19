import { type MouseEvent, type ReactElement, useEffect, useState } from "react";

import StickyNote2Rounded from "@mui/icons-material/StickyNote2Rounded";
import { alpha, Box, Popover, Stack, Typography } from "@mui/material";

import { type RowView } from "@repo/contracts/lms/session-detail";

import {
  buildLoadLine,
  buildRowSubLine,
  buildVolume,
  type LoadPrompt,
} from "../utils/athlete-session-presentation";
import {
  FONT_WEIGHT_SEMI_BOLD,
  LOAD_AT_PREFIX,
  RESOLVE_POPOVER_WIDTH_PX,
  ROW_AT_ALPHA,
  ROW_AT_PX,
  ROW_LOAD_ALPHA,
  ROW_LOAD_PX,
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
import { type SessionEditorControls } from "../utils/use-session-logging";

import { DemoLink } from "./demo-link";
import { InlineOneRmEditor } from "./inline-one-rm-editor";
import { InlineProfilePicker } from "./inline-profile-picker";
import { LoadPromptButton } from "./load-prompt-button";

const NOTE_SEPARATOR = " ";

export type SchemaRowProps = {
  row: RowView;
  editor: SessionEditorControls;
};

export const SchemaRow = ({ row, editor }: SchemaRowProps): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const volume = buildVolume(row);
  const loadLine = buildLoadLine(row.resolvedLoad, row.load);
  const subLine = buildRowSubLine(row);
  const noteText = row.notes !== null ? row.notes.join(NOTE_SEPARATOR) : "";
  const prompt = loadLine.prompt;
  const isEditing = editor.activeEditor?.rowId === row.rowId;
  const editorKind = isEditing ? editor.activeEditor?.kind : null;

  useEffect(() => {
    if (!isEditing) {
      setAnchorEl(null);
    }
  }, [isEditing]);

  const openPrompt = (event: MouseEvent<HTMLElement>, next: LoadPrompt): void => {
    setAnchorEl(event.currentTarget);

    if (next.kind === "one_rm") {
      editor.openOneRmEditor(row.rowId, next.exerciseId);

      return;
    }

    editor.openProfileEditor(row.rowId);
  };

  const closePrompt = (): void => {
    setAnchorEl(null);
    editor.closeEditor();
  };

  return (
    <Box sx={{ px: `${ROW_PADDING_X_PX}px`, py: `${ROW_PADDING_Y_PX}px` }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
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
          sx={{ flex: "0 0 auto", flexWrap: "wrap", justifyContent: "flex-end" }}
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
          {loadLine.showAt ? (
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
          {loadLine.loadStr.length > 0 ? (
            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(ROW_LOAD_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: alpha(theme.palette.common.white, ROW_LOAD_ALPHA),
                whiteSpace: "nowrap",
              })}
            >
              {loadLine.loadStr}
            </Typography>
          ) : null}
          {prompt !== null ? (
            <LoadPromptButton label={prompt.label} onClick={(event) => openPrompt(event, prompt)} />
          ) : null}
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

      <Popover
        open={anchorEl !== null && isEditing}
        anchorEl={anchorEl}
        onClose={closePrompt}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, p: 2, width: RESOLVE_POPOVER_WIDTH_PX } } }}
      >
        {editorKind === "one_rm" ? (
          <InlineOneRmEditor
            movement={row.movement}
            value={editor.oneRmValue}
            isSubmitting={editor.oneRmPending}
            canSubmit={editor.oneRmCanSubmit}
            onChange={editor.setOneRmValue}
            onCommit={editor.commitOneRm}
          />
        ) : null}
        {editorKind === "profile" && row.load !== null ? (
          <InlineProfilePicker
            load={row.load}
            selections={editor.profileSelections}
            isSubmitting={editor.profilePending}
            onPick={editor.pickProfile}
          />
        ) : null}
      </Popover>
    </Box>
  );
};
