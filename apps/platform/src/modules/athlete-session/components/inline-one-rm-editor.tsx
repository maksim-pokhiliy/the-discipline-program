import { type ReactElement } from "react";

import { Button, Stack, TextField, Typography } from "@mui/material";

import {
  FONT_WEIGHT_DISPLAY,
  INLINE_EDITOR_TITLE_LETTER_SPACING,
  INLINE_EDITOR_TITLE_PX,
  ONE_RM_EDITOR_TITLE_PREFIX,
  ONE_RM_EDITOR_TITLE_SUFFIX,
  ONE_RM_INPUT_LABEL,
  ONE_RM_SET_LABEL,
} from "../utils/athlete-session.constants";

const INPUT_MODE = "numeric";

export type InlineOneRmEditorProps = {
  movement: string;
  value: string;
  isSubmitting: boolean;
  canSubmit: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
};

export const InlineOneRmEditor = ({
  movement,
  value,
  isSubmitting,
  canSubmit,
  onChange,
  onCommit,
}: InlineOneRmEditorProps): ReactElement => (
  <Stack spacing={1}>
    <Typography
      component="div"
      sx={(theme) => ({
        fontSize: theme.typography.pxToRem(INLINE_EDITOR_TITLE_PX),
        fontWeight: FONT_WEIGHT_DISPLAY,
        letterSpacing: INLINE_EDITOR_TITLE_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.primary.main,
      })}
    >
      {`${ONE_RM_EDITOR_TITLE_PREFIX} ${movement} ${ONE_RM_EDITOR_TITLE_SUFFIX}`}
    </Typography>

    <TextField
      size="small"
      label={ONE_RM_INPUT_LABEL}
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      slotProps={{ htmlInput: { inputMode: INPUT_MODE, min: 0 } }}
    />
    <Button
      size="small"
      variant="contained"
      color="primary"
      fullWidth
      onClick={onCommit}
      disabled={!canSubmit || isSubmitting}
    >
      {ONE_RM_SET_LABEL}
    </Button>
  </Stack>
);
