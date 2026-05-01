import { type AlertColor } from "@mui/material";
import { type Components, type Theme, alpha } from "@mui/material/styles";

const severityStyles = (theme: Theme, severity: AlertColor) => {
  const main = theme.palette[severity].main;

  return {
    "& .MuiAlert-icon": { color: main },
    "& .MuiAlert-action": { color: theme.palette.text.secondary },
  };
};

export const MuiAlert: NonNullable<Components<Theme>["MuiAlert"]> = {
  defaultProps: {
    variant: "standard",
  },

  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.text.primary,
    }),

    standard: ({ theme, ownerState }) => {
      const severity = ownerState.severity ?? "info";
      const main = theme.palette[severity].main;

      return {
        backgroundColor: alpha(main, 0.08),
        ...severityStyles(theme, severity),
      };
    },

    filled: ({ theme, ownerState }) => {
      const severity = ownerState.severity ?? "info";
      const main = theme.palette[severity].main;

      return {
        backgroundColor: alpha(main, 0.15),
        borderLeft: `4px solid ${main}`,
        ...severityStyles(theme, severity),
      };
    },

    outlined: ({ theme, ownerState }) => {
      const severity = ownerState.severity ?? "info";
      const main = theme.palette[severity].main;

      return {
        borderColor: alpha(main, 0.4),
        ...severityStyles(theme, severity),
      };
    },
  },
};
