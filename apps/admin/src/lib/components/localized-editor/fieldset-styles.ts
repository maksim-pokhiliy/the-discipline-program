import { type Theme } from "@mui/material";

export const fieldsetStyles = (theme: Theme) => ({
  border: 0,
  m: 0,
  p: 0,
  minWidth: 0,
  "&:disabled": { opacity: theme.palette.action.disabledOpacity },
});
