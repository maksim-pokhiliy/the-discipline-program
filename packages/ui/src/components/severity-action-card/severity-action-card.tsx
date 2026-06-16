import { type ReactElement, type ReactNode } from "react";

import { Box, Card } from "@mui/material";

import { ActionItemSeverity } from "@repo/contracts/coaching/coach-action-item";

const STRIPE_WIDTH_PX = 4;
const BODY_PADDING_PX = 12;
const BODY_GAP_PX = 12;
const ACTIONS_GAP_PX = 4;
const ACTIONS_PADDING_Y_PX = 8;
const ACTIONS_PADDING_RIGHT_PX = 10;

type SeverityColor = "error" | "warning" | "info";

const SEVERITY_STRIPE_COLOR: Record<ActionItemSeverity, SeverityColor> = {
  [ActionItemSeverity.CRITICAL]: "error",
  [ActionItemSeverity.WARNING]: "warning",
  [ActionItemSeverity.INFO]: "info",
};

export type SeverityActionCardProps = {
  severity: ActionItemSeverity;
  children: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
};

export const SeverityActionCard = ({
  severity,
  children,
  actions,
  onClick,
}: SeverityActionCardProps): ReactElement => {
  const stripeColor = SEVERITY_STRIPE_COLOR[severity];
  const isInteractive = onClick !== undefined;

  return (
    <Card
      {...(isInteractive && { role: "button", tabIndex: 0, onClick })}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: `${STRIPE_WIDTH_PX}px 1fr auto`,
        alignItems: "stretch",
        height: "auto",
        overflow: "hidden",
        ...(isInteractive && { cursor: "pointer" }),
        transition: theme.transitions.create(["border-color", "background-color"]),
        "&:hover": {
          borderColor: theme.palette.dividerStrong,
        },
      })}
    >
      <Box sx={(theme) => ({ bgcolor: theme.palette[stripeColor].main })} />
      <Box
        sx={{
          display: "flex",
          gap: `${BODY_GAP_PX}px`,
          alignItems: "flex-start",
          minWidth: 0,
          p: `${BODY_PADDING_PX}px`,
        }}
      >
        {children}
      </Box>
      {actions !== undefined && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: `${ACTIONS_GAP_PX}px`,
            py: `${ACTIONS_PADDING_Y_PX}px`,
            pr: `${ACTIONS_PADDING_RIGHT_PX}px`,
          }}
        >
          {actions}
        </Box>
      )}
    </Card>
  );
};
