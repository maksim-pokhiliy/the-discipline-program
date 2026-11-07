import { type ReactElement } from "react";

import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import { IconButton, Tooltip } from "@mui/material";

import { type MoveDirection } from "./language-order";

type LanguageMoveButtonProps = {
  name: string;
  direction: MoveDirection;
  isUnavailable: boolean;
  onMove: () => void;
};

export const LanguageMoveButton = ({
  name,
  direction,
  isUnavailable,
  onMove,
}: LanguageMoveButtonProps): ReactElement => (
  <Tooltip title={direction === "up" ? "Move up" : "Move down"}>
    <IconButton
      aria-label={`Move ${name} ${direction}`}
      aria-disabled={isUnavailable}
      sx={
        isUnavailable
          ? {
              color: "action.disabled",
              cursor: "default",
              "&:hover": { backgroundColor: "action.disabledBackground" },
            }
          : {}
      }
      onClick={() => {
        if (!isUnavailable) {
          onMove();
        }
      }}
    >
      {direction === "up" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
    </IconButton>
  </Tooltip>
);
