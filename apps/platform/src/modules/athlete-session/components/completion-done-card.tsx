import { Fragment, type ReactElement } from "react";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ReplayRounded from "@mui/icons-material/ReplayRounded";
import { alpha, Box, Button, Card, Stack, Typography } from "@mui/material";

import {
  COMPLETION_DONE_DATE_ALPHA,
  COMPLETION_DONE_DATE_PX,
  COMPLETION_DONE_ICON_PX,
  COMPLETION_DONE_TITLE_LABEL,
  FONT_WEIGHT_SEMI_BOLD,
  RAIL_CARD_PADDING_PX,
  RAIL_CARD_TITLE_PX,
  REOPEN_LABEL,
  RESULT_STRIP_BG_ALPHA,
  RESULT_STRIP_BORDER_ALPHA,
} from "../utils/athlete-session.constants";

export type CompletionDoneCardProps = {
  completedLabel: string | null;
  onReopen: () => void;
};

export const CompletionDoneCard = ({
  completedLabel,
  onReopen,
}: CompletionDoneCardProps): ReactElement => (
  <Fragment>
    <Card
      variant="outlined"
      sx={(theme) => ({
        p: `${RAIL_CARD_PADDING_PX}px`,
        bgcolor: alpha(theme.palette.success.main, RESULT_STRIP_BG_ALPHA),
        borderColor: alpha(theme.palette.success.main, RESULT_STRIP_BORDER_ALPHA),
      })}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <CheckCircleRounded
          sx={(theme) => ({ fontSize: COMPLETION_DONE_ICON_PX, color: theme.palette.success.main })}
        />
        <Box>
          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(RAIL_CARD_TITLE_PX),
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
      </Stack>
    </Card>
    <Button
      fullWidth
      variant="outlined"
      color="inherit"
      startIcon={<ReplayRounded />}
      onClick={onReopen}
      sx={{ mt: 1.75 }}
    >
      {REOPEN_LABEL}
    </Button>
  </Fragment>
);
