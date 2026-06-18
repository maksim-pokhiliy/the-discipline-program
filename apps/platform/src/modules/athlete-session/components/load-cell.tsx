import { type ReactElement } from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import { Box, Stack, Typography } from "@mui/material";

import { type Load } from "@repo/contracts/lms/_shared";
import { type ResolvedLoad } from "@repo/contracts/lms/session-detail";

import { type LoadCellModel, resolveLoadCell } from "../utils/athlete-session-presentation";
import {
  BODYWEIGHT_LABEL,
  FONT_WEIGHT_SEMI_BOLD,
  LOAD_BW_PX,
  LOAD_HINT_ALPHA,
  LOAD_HINT_PX,
  LOAD_MIN_WIDTH_PX,
  LOAD_SUB_ALPHA,
  LOAD_SUB_PX,
  LOAD_VALUE_PX,
  PICK_PROFILE_LABEL,
  SET_ONE_RM_LABEL,
} from "../utils/athlete-session.constants";

import { DisplayNumber } from "./display-number";
import { LoadPromptButton } from "./load-prompt-button";
import { LoadSubLine } from "./load-sub-line";

export type LoadCellProps = {
  rowId: string;
  resolvedLoad: ResolvedLoad | null;
  load: Load | null;
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
};

const renderCell = (model: LoadCellModel, props: LoadCellProps): ReactElement | null => {
  switch (model.state) {
    case "resolved":
      return (
        <Box>
          <DisplayNumber value={model.value} px={LOAD_VALUE_PX} />
          {model.sub !== null ? (
            <LoadSubLine text={model.sub} px={LOAD_SUB_PX} alphaValue={LOAD_SUB_ALPHA} />
          ) : null}
        </Box>
      );
    case "bodyweight":
      return (
        <Typography
          component="div"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(LOAD_BW_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: theme.palette.text.muted,
          })}
        >
          {BODYWEIGHT_LABEL}
        </Typography>
      );
    case "missing_one_rm":
      return (
        <Stack spacing={0.5} alignItems="flex-end">
          <LoadPromptButton
            label={SET_ONE_RM_LABEL}
            icon={<AddRounded />}
            onClick={() => props.onSetOneRm(model.exerciseId)}
          />
          <LoadSubLine text={model.hint} px={LOAD_HINT_PX} alphaValue={LOAD_HINT_ALPHA} />
        </Stack>
      );
    case "missing_profile_pick":
      return (
        <Stack spacing={0.5} alignItems="flex-end">
          <LoadPromptButton
            label={PICK_PROFILE_LABEL}
            icon={<TuneRounded />}
            onClick={() => props.onPickProfile(props.rowId)}
          />
          <LoadSubLine text={model.hint} px={LOAD_HINT_PX} alphaValue={LOAD_HINT_ALPHA} />
        </Stack>
      );
    case "empty":
      return null;
    default:
      model satisfies never;

      return null;
  }
};

export const LoadCell = (props: LoadCellProps): ReactElement | null => {
  const model = resolveLoadCell(props.resolvedLoad, props.load);
  const cell = renderCell(model, props);

  if (cell === null) {
    return null;
  }

  return <Box sx={{ flexShrink: 0, textAlign: "right", minWidth: LOAD_MIN_WIDTH_PX }}>{cell}</Box>;
};
