import { alpha, type Components, type Theme } from "@mui/material/styles";

import { focusRing } from "../focus";

const TRACK_WIDTH = 42;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 16;
const THUMB_INSET = 3;
const THUMB_SHIFT = 18;
const THUMB_PRESS_SIZE = 20;
const THUMB_SHIFT_PRESS = 14;
const CHECKED_TRACK_ALPHA = 0.32;
const SPRING_EASING = "cubic-bezier(0.34, 1.4, 0.5, 1)";
const SPRING_DURATION = 220;

export const MuiSwitch: NonNullable<Components<Theme>["MuiSwitch"]> = {
  styleOverrides: {
    root: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      padding: 0,
      overflow: "visible",
    },

    switchBase: ({ theme }) => ({
      padding: 0,
      top: THUMB_INSET,
      left: THUMB_INSET,
      color: theme.palette.text.secondary,
      transition: theme.transitions.create("transform", {
        duration: SPRING_DURATION,
        easing: SPRING_EASING,
      }),

      "&:active .MuiSwitch-thumb": {
        width: THUMB_PRESS_SIZE,
      },

      "&.Mui-focusVisible + .MuiSwitch-track": {
        boxShadow: focusRing(theme),
      },

      "&.Mui-checked": {
        transform: `translateX(${THUMB_SHIFT}px)`,

        "& .MuiSwitch-thumb": {
          backgroundColor: theme.palette.primary.main,
        },

        "&:active": {
          transform: `translateX(${THUMB_SHIFT_PRESS}px)`,
        },

        "& + .MuiSwitch-track": {
          backgroundColor: alpha(theme.palette.primary.main, CHECKED_TRACK_ALPHA),
          borderColor: theme.palette.primary.main,
          opacity: 1,
        },
      },

      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.4,
      },
    }),

    thumb: ({ theme }) => ({
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: "50%",
      boxShadow: "none",
      backgroundColor: theme.palette.text.secondary,
      transition: theme.transitions.create(["width", "background-color"], {
        duration: theme.transitions.duration.shortest,
      }),
    }),

    track: ({ theme }) => ({
      borderRadius: TRACK_HEIGHT / 2,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.action.selected,
      opacity: 1,
      boxSizing: "border-box",
      transition: theme.transitions.create(["background-color", "border-color", "box-shadow"], {
        duration: theme.transitions.duration.shortest,
      }),
    }),
  },
};
