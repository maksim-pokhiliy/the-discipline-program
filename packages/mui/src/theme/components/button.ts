import { alpha, Components, Theme } from "@mui/material/styles";

export const MuiButton: Components<Theme>["MuiButton"] = {
  defaultProps: {
    disableElevation: true,
  },

  styleOverrides: {
    root: {
      minWidth: "unset",
      textTransform: "none",
    },

    containedSizeLarge: ({ theme }) => ({
      ...theme.typography.h6,
      fontWeight: 600,
      padding: theme.spacing(2, 4),
    }),
  },

  variants: [
    {
      props: { variant: "text", color: "primary" },
      style: ({ theme }) => ({
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeightMedium,
        color: theme.palette.appBar.contrastText,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),

        [theme.breakpoints.down("sm")]: {
          width: "100%",
          padding: theme.spacing(2),
          borderRadius: 0,
        },
      }),
    },
    {
      props: { variant: "text", color: "secondary" },
      style: ({ theme }) => ({
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeightRegular,
        color: alpha(theme.palette.appBar.contrastText, 0.6),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        transition: theme.transitions.create(["color", "background-color"], {
          duration: theme.transitions.duration.short,
        }),

        "&:hover": {
          color: theme.palette.appBar.contrastText,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },

        [theme.breakpoints.down("sm")]: {
          width: "100%",
          padding: theme.spacing(2),
          borderRadius: 0,
        },
      }),
    },
  ],
};
