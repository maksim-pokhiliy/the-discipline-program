import { type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import { alpha, Box, Button, Stack, Typography } from "@mui/material";

import {
  COMPLETION_BAR_BG_ALPHA,
  COMPLETION_BAR_BLUR_PX,
  COMPLETION_BAR_PADDING_BOTTOM_PX,
  COMPLETION_BAR_PADDING_TOP_PX,
  COMPLETION_BAR_PADDING_X_PX,
  COMPLETION_BUTTON_HEIGHT_PX,
  COMPLETION_DONE_DATE_ALPHA,
  COMPLETION_DONE_DATE_PX,
  COMPLETION_DONE_ICON_PX,
  COMPLETION_DONE_TITLE_LABEL,
  COMPLETION_DONE_TITLE_PX,
  COMPLETION_REOPEN_HEIGHT_PX,
  FONT_WEIGHT_SEMI_BOLD,
  MARK_COMPLETED_LABEL,
  REOPEN_LABEL,
} from "../utils/athlete-session.constants";

export type CompletionBarProps = {
  done: boolean;
  completedLabel: string | null;
  onComplete: () => void;
  onReopen: () => void;
};

export const CompletionBar = ({
  done,
  completedLabel,
  onComplete,
  onReopen,
}: CompletionBarProps): ReactElement => (
  <Box
    sx={(theme) => ({
      px: `${COMPLETION_BAR_PADDING_X_PX}px`,
      pt: `${COMPLETION_BAR_PADDING_TOP_PX}px`,
      pb: `${COMPLETION_BAR_PADDING_BOTTOM_PX}px`,
      bgcolor: alpha(theme.palette.background.default, COMPLETION_BAR_BG_ALPHA),
      backdropFilter: `blur(${COMPLETION_BAR_BLUR_PX}px)`,
      borderTop: `1px solid ${theme.palette.divider}`,
    })}
  >
    {done ? (
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <CheckCircleRounded
          sx={(theme) => ({ fontSize: COMPLETION_DONE_ICON_PX, color: theme.palette.success.main })}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(COMPLETION_DONE_TITLE_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              color: theme.palette.text.primary,
            })}
          >
            {COMPLETION_DONE_TITLE_LABEL}
          </Typography>
          {completedLabel !== null ? (
            <Typography
              component="div"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(COMPLETION_DONE_DATE_PX),
                color: alpha(theme.palette.common.white, COMPLETION_DONE_DATE_ALPHA),
              })}
            >
              {completedLabel}
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onReopen}
          sx={{ height: COMPLETION_REOPEN_HEIGHT_PX }}
        >
          {REOPEN_LABEL}
        </Button>
      </Stack>
    ) : (
      <Button
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<CheckRounded />}
        onClick={onComplete}
        sx={{ height: COMPLETION_BUTTON_HEIGHT_PX }}
      >
        {MARK_COMPLETED_LABEL}
      </Button>
    )}
  </Box>
);
