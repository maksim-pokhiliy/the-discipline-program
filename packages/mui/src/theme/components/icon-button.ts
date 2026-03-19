import { alpha, type Components, type Theme } from "@mui/material/styles";

export const MuiIconButton: Components<Theme>["MuiIconButton"] = {
  defaultProps: {
    size: "small",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      transition: theme.transitions.create(["background-color", "color"], {
        duration: theme.transitions.duration.short,
      }),
      "&:hover": {
        backgroundColor: alpha(theme.palette.common.white, 0.06),
      },
    }),

    sizeSmall: {
      padding: 4,
      "& .MuiSvgIcon-root": {
        fontSize: 18,
      },
    },

    sizeMedium: {
      padding: 8,
      "& .MuiSvgIcon-root": {
        fontSize: 22,
      },
    },

    sizeLarge: {
      padding: 12,
      "& .MuiSvgIcon-root": {
        fontSize: 26,
      },
    },
  },
};
