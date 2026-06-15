import { type ReactElement } from "react";

import { Button } from "@mui/material";

const PLUS_PREFIX = "+ ";

export type PlusRowButtonProps = {
  onClick: () => void;
  label: string;
  disabled?: boolean | undefined;
  accent?: boolean | undefined;
};

export const PlusRowButton: React.FC<PlusRowButtonProps> = ({
  onClick,
  label,
  disabled = false,
}): ReactElement => (
  <Button
    size="tiny"
    variant="text"
    onClick={onClick}
    disabled={disabled}
    sx={{ alignSelf: "flex-start" }}
  >
    {`${PLUS_PREFIX}${label}`}
  </Button>
);
