"use client";

import { useTheme } from "@mui/material/styles";
import { Toaster as Sonner } from "sonner";

export const Toaster = () => {
  const theme = useTheme();

  const style = {
    fontFamily: theme.typography.fontFamily,
    zIndex: theme.zIndex.snackbar,

    "--normal-bg": theme.palette.background.paper,
    "--normal-border": theme.palette.divider,
    "--normal-text": theme.palette.text.primary,

    "--success-bg": theme.palette.success.main,
    "--success-border": theme.palette.success.main,
    "--success-text": theme.palette.success.contrastText,

    "--error-bg": theme.palette.error.main,
    "--error-border": theme.palette.error.main,
    "--error-text": theme.palette.error.contrastText,

    "--warning-bg": theme.palette.warning.main,
    "--warning-border": theme.palette.warning.main,
    "--warning-text": theme.palette.warning.contrastText,

    "--info-bg": theme.palette.info.main,
    "--info-border": theme.palette.info.main,
    "--info-text": theme.palette.info.contrastText,
  };

  return <Sonner richColors position="bottom-right" style={style} />;
};
