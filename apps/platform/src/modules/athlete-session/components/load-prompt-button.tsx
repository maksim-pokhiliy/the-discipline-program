import { type MouseEvent, type ReactElement } from "react";

import { Button } from "@mui/material";

export type LoadPromptButtonProps = {
  label: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
};

export const LoadPromptButton = ({ label, onClick }: LoadPromptButtonProps): ReactElement => (
  <Button size="tiny" color="primary" variant="outlined" onClick={onClick}>
    {label}
  </Button>
);
