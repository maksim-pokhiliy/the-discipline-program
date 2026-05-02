"use client";

import { type MouseEvent, type ReactNode, useRef, useState } from "react";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu } from "@mui/material";

export type RowActionMenuProps = {
  ariaLabel: string;
  isDisabled?: boolean;
  children: (close: () => void) => ReactNode;
};

export const RowActionMenu = ({ ariaLabel, isDisabled, children }: RowActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const close = () => setIsOpen(false);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <IconButton
        ref={anchorRef}
        size="small"
        onClick={handleOpen}
        disabled={isDisabled ?? false}
        aria-label={ariaLabel}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorRef.current} open={isOpen} onClose={close}>
        {children(close)}
      </Menu>
    </>
  );
};
