import { type ReactElement } from "react";

import { alpha, ButtonBase, Stack } from "@mui/material";

import {
  FONT_WEIGHT_SEMI_BOLD,
  PILL_BORDER_ALPHA,
  PILL_HEIGHT_PX,
  PILL_PADDING_X_PX,
  PILL_RADIUS_PX,
  PILL_TEXT_PX,
} from "../utils/plan-timetable.constants";

export type PlanSwitcherItem = {
  planId: string;
  planTitle: string;
};

export type PlanSwitcherProps = {
  plans: PlanSwitcherItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export const PlanSwitcher = ({
  plans,
  selectedIndex,
  onSelect,
}: PlanSwitcherProps): ReactElement => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      overflowX: "auto",
      pb: 0.5,
      "&::-webkit-scrollbar": { display: "none" },
      scrollbarWidth: "none",
    }}
  >
    {plans.map((plan, index) => {
      const isSelected = index === selectedIndex;

      return (
        <ButtonBase
          key={plan.planId}
          onClick={() => onSelect(index)}
          sx={(theme) => ({
            flexShrink: 0,
            height: PILL_HEIGHT_PX,
            px: `${PILL_PADDING_X_PX}px`,
            borderRadius: `${PILL_RADIUS_PX}px`,
            fontSize: theme.typography.pxToRem(PILL_TEXT_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            border: `1px solid ${
              isSelected
                ? theme.palette.primary.main
                : alpha(theme.palette.common.white, PILL_BORDER_ALPHA)
            }`,
            bgcolor: isSelected ? theme.palette.primary.main : "transparent",
            color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
            transition: theme.transitions.create(["background-color", "border-color", "color"]),
          })}
        >
          {plan.planTitle}
        </ButtonBase>
      );
    })}
  </Stack>
);
