import { type ReactElement } from "react";

import EventBusyIcon from "@mui/icons-material/EventBusy";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { Box, type SvgIconProps, alpha } from "@mui/material";

import { ActionItemType } from "@repo/contracts/coaching/coach-action-item";

const TYPE_TINT = 0.18;
const CHIP_RADIUS_FACTOR = 1;
const CHIP_HEIGHT_PX = 18;
const CHIP_PADDING_X_PX = 6;
const CHIP_GAP_PX = 4;
const LABEL_FONT_PX = 9.5;
const LABEL_LETTER_SPACING = "0.08em";
const ICON_FONT_PX = 11;

type ActionTypeColor = "error" | "warning";

type ActionTypeDescriptor = {
  color: ActionTypeColor;
  label: string;
  Icon: React.ComponentType<SvgIconProps>;
};

const TYPE_DESCRIPTORS: Record<ActionItemType, ActionTypeDescriptor> = {
  [ActionItemType.HEALTH_REPORT]: {
    color: "error",
    label: "Health",
    Icon: LocalHospitalIcon,
  },
  [ActionItemType.MISSED_WORKOUTS]: {
    color: "warning",
    label: "Missed",
    Icon: EventBusyIcon,
  },
};

export type ActionTypeChipProps = {
  type: ActionItemType;
};

export const ActionTypeChip = ({ type }: ActionTypeChipProps): ReactElement => {
  const { color, label, Icon } = TYPE_DESCRIPTORS[type];

  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: `${CHIP_GAP_PX}px`,
        height: `${CHIP_HEIGHT_PX}px`,
        px: `${CHIP_PADDING_X_PX}px`,
        borderRadius: CHIP_RADIUS_FACTOR,
        bgcolor: alpha(theme.palette[color].main, TYPE_TINT),
        color: theme.palette[color].main,
        fontSize: theme.typography.pxToRem(LABEL_FONT_PX),
        fontWeight: theme.typography.fontWeightBold,
        letterSpacing: LABEL_LETTER_SPACING,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      })}
    >
      <Icon sx={{ fontSize: `${ICON_FONT_PX}px` }} />
      {label}
    </Box>
  );
};
