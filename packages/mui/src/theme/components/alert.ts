import { type Components, type Theme, alpha } from "@mui/material/styles";

export const MuiAlert: Components<Theme>["MuiAlert"] = {
  styleOverrides: {
    filled: ({ theme, ownerState }) => {
      const color = ownerState.severity ?? "info";
      const main = theme.palette[color].main;
      const contrastText = theme.palette[color].contrastText;

      return {
        backgroundColor: alpha(main, 0.08),
        color: theme.palette.text.primary,
        borderLeft: `4px solid ${main}`,

        "& .MuiAlertTitle-root": {
          color: theme.palette.text.primary,
        },

        "& .MuiAlert-icon": {
          color: main,
        },

        "& .MuiAlert-icon .MuiAvatar-root": {
          width: theme.spacing(4),
          height: theme.spacing(4),
          backgroundColor: main,
          color: contrastText,
          fontSize: theme.typography.caption.fontSize,
        },

        "& .MuiAlert-action": {
          color: theme.palette.text.secondary,
        },
      };
    },
  },
};
