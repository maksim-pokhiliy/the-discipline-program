import { Components, Theme } from "@mui/material/styles";

export const MuiDialog: Components<Theme>["MuiDialog"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: Number(theme.shape.borderRadius) * 2,
      boxShadow: theme.shadows[24],
    }),
  },
};

export const MuiDialogTitle: Components<Theme>["MuiDialogTitle"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(3),
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.fontWeightBold,
    }),
  },
};

export const MuiDialogContent: Components<Theme>["MuiDialogContent"] = {
  styleOverrides: {
    root: {
      padding: 0,
      "&:first-of-type": {
        paddingTop: 0,
      },
    },
  },
};

export const MuiDialogActions: Components<Theme>["MuiDialogActions"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(3),
      borderTop: `1px solid ${theme.palette.divider}`,
      gap: theme.spacing(2),

      "& .MuiButton-root": {
        minWidth: theme.spacing(12),
      },
    }),
  },
};
