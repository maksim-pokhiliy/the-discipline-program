import { type Theme } from "@mui/material/styles";

import { focusRing } from "../focus";

const GLYPH_PX = 20;

export const selectionControlStyleOverrides = (focusRadius: string) => ({
  root: ({ theme }: { theme: Theme }) => ({
    color: theme.palette.text.muted,
    transition: theme.transitions.create(["color", "transform"], {
      duration: theme.transitions.duration.shortest,
    }),

    "& .MuiSvgIcon-root": {
      fontSize: theme.typography.pxToRem(GLYPH_PX),
    },

    "&:hover": {
      color: theme.palette.text.secondary,
      backgroundColor: "transparent",
    },

    "&:active": {
      transform: "scale(0.9)",
    },

    "&.Mui-checked": {
      color: theme.palette.primary.main,
    },

    "&.Mui-focusVisible .MuiSvgIcon-root": {
      borderRadius: focusRadius,
      boxShadow: focusRing(theme),
    },

    "&.Mui-disabled": {
      color: theme.palette.text.disabled,
    },
  }),
});
