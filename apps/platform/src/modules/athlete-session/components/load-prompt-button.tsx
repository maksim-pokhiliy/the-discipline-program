import { type ReactElement } from "react";

import { alpha, Button } from "@mui/material";

import { INTENSITY_BADGE_BG_ALPHA } from "../utils/athlete-session.constants";

export type LoadPromptButtonProps = {
  label: string;
  icon: ReactElement;
  onClick: () => void;
};

export const LoadPromptButton = ({ label, icon, onClick }: LoadPromptButtonProps): ReactElement => (
  <Button
    size="small"
    color="primary"
    variant="outlined"
    startIcon={icon}
    onClick={onClick}
    sx={(theme) => ({ bgcolor: alpha(theme.palette.primary.main, INTENSITY_BADGE_BG_ALPHA) })}
  >
    {label}
  </Button>
);
