import { type ReactElement } from "react";

import CheckRounded from "@mui/icons-material/CheckRounded";
import { Button, Card, Typography } from "@mui/material";

import {
  COMPLETION_BUTTON_HEIGHT_PX,
  COMPLETION_READY_BODY_LABEL,
  COMPLETION_READY_TITLE_LABEL,
  FONT_WEIGHT_SEMI_BOLD,
  MARK_COMPLETED_LABEL,
  RAIL_CARD_BODY_LINE_HEIGHT,
  RAIL_CARD_BODY_PX,
  RAIL_CARD_PADDING_PX,
  RAIL_CARD_TITLE_PX,
} from "../utils/athlete-session.constants";

export type CompletionReadyCardProps = {
  onComplete: () => void;
};

export const CompletionReadyCard = ({ onComplete }: CompletionReadyCardProps): ReactElement => (
  <Card variant="outlined" sx={{ p: `${RAIL_CARD_PADDING_PX}px` }}>
    <Typography
      component="div"
      sx={(theme) => ({
        fontSize: theme.typography.pxToRem(RAIL_CARD_TITLE_PX),
        fontWeight: FONT_WEIGHT_SEMI_BOLD,
        color: theme.palette.text.primary,
      })}
    >
      {COMPLETION_READY_TITLE_LABEL}
    </Typography>
    <Typography
      component="div"
      sx={(theme) => ({
        mt: 0.75,
        fontSize: theme.typography.pxToRem(RAIL_CARD_BODY_PX),
        lineHeight: RAIL_CARD_BODY_LINE_HEIGHT,
        color: theme.palette.text.secondary,
      })}
    >
      {COMPLETION_READY_BODY_LABEL}
    </Typography>
    <Button
      fullWidth
      variant="contained"
      color="primary"
      startIcon={<CheckRounded />}
      onClick={onComplete}
      sx={{ mt: 2, height: COMPLETION_BUTTON_HEIGHT_PX }}
    >
      {MARK_COMPLETED_LABEL}
    </Button>
  </Card>
);
