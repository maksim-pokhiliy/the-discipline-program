import { alpha, type Components, type Theme } from "@mui/material/styles";

const SELECTED_TINT = 0.08;
const SELECTED_TINT_HOVER = 0.12;

export const MuiTabs: NonNullable<Components<Theme>["MuiTabs"]> = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),

    indicator: {
      display: "none",
    },

    flexContainer: ({ theme }) => ({
      gap: theme.spacing(1.5),
    }),
  },
};

export const MuiTab: NonNullable<Components<Theme>["MuiTab"]> = {
  styleOverrides: {
    root: ({ theme }) => {
      const radius = theme.shape.borderRadius;

      return {
        padding: theme.spacing(0, 3),
        borderRadius: `${radius}px ${radius}px 0 0`,
        whiteSpace: "nowrap",
        transition: theme.transitions.create(
          ["background-color", "color", "box-shadow", "transform"],
          { duration: theme.transitions.duration.shortest },
        ),

        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
        },

        "&:active": {
          transform: "translateY(1px)",
        },

        "&.Mui-selected": {
          color: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT),

          "&:hover": {
            backgroundColor: alpha(theme.palette.primary.main, SELECTED_TINT_HOVER),
          },
        },

        "&.Mui-focusVisible": {
          backgroundColor: "transparent",
        },
      };
    },
  },
};
