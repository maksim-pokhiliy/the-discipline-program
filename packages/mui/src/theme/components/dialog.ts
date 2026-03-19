import { type Components, type Theme } from "@mui/material/styles";

export const MuiDialog: Components<Theme>["MuiDialog"] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      borderRadius: Number(theme.shape.borderRadius) * 1.5,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.paper,
    }),
  },
};

export const MuiDialogTitle: Components<Theme>["MuiDialogTitle"] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(2),
      justifyContent: "space-between",
      alignItems: "center",
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
      padding: theme.spacing(2),
      borderTop: `1px solid ${theme.palette.divider}`,
      gap: theme.spacing(2),

      "& .MuiButton-root": {
        minWidth: theme.spacing(12),
      },
    }),
  },
};
