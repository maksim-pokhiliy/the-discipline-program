import { type Components, type Theme } from "@mui/material/styles";

export const MuiAvatar: Components<Theme>["MuiAvatar"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: 600,
      fontSize: theme.typography.pxToRem(14),
      width: 36,
      height: 36,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    }),
  },

  variants: [
    {
      props: { variant: "rounded" },
      style: ({ theme }) => ({
        borderRadius: theme.shape.borderRadius,
      }),
    },
  ],
};
