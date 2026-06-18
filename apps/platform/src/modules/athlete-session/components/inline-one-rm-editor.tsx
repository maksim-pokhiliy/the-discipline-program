import { type ReactElement } from "react";

import { alpha, Box, Button, Stack, TextField, Typography } from "@mui/material";

import {
  FONT_WEIGHT_DISPLAY,
  INLINE_EDITOR_BG_ALPHA,
  INLINE_EDITOR_BORDER_ALPHA,
  INLINE_EDITOR_GAP_PX,
  INLINE_EDITOR_MARGIN_BOTTOM_PX,
  INLINE_EDITOR_MARGIN_X_PX,
  INLINE_EDITOR_PADDING_PX,
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
  <Box
    sx={(theme) => ({
      mx: `${INLINE_EDITOR_MARGIN_X_PX}px`,
      mb: `${INLINE_EDITOR_MARGIN_BOTTOM_PX}px`,
      p: `${INLINE_EDITOR_PADDING_PX}px`,
      borderRadius: theme.shape.borderRadius,
      bgcolor: alpha(theme.palette.primary.main, INLINE_EDITOR_BG_ALPHA),
      border: `1px solid ${alpha(theme.palette.primary.main, INLINE_EDITOR_BORDER_ALPHA)}`,
    })}
  >
    <Typography
      component="div"
      sx={(theme) => ({
        mb: 1,
        fontSize: theme.typography.pxToRem(INLINE_EDITOR_TITLE_PX),
        fontWeight: FONT_WEIGHT_DISPLAY,
        letterSpacing: INLINE_EDITOR_TITLE_LETTER_SPACING,
        textTransform: "uppercase",
        color: theme.palette.primary.main,
      })}
    >
      {`${ONE_RM_EDITOR_TITLE_PREFIX} ${movement} ${ONE_RM_EDITOR_TITLE_SUFFIX}`}
    </Typography>

    <Stack direction="row" spacing={`${INLINE_EDITOR_GAP_PX}px`} alignItems="flex-start">
      <TextField
        label={ONE_RM_INPUT_LABEL}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        slotProps={{ htmlInput: { inputMode: INPUT_MODE, min: 0 } }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={onCommit}
        disabled={!canSubmit || isSubmitting}
      >
        {ONE_RM_SET_LABEL}
      </Button>
    </Stack>
  </Box>
);
