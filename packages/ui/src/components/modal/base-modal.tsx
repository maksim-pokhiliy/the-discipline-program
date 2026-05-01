"use client";

import { type ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  type DialogProps,
} from "@mui/material";

export type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: DialogProps["maxWidth"] | undefined;
  fullWidth?: boolean | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
  disableBackdropClick?: boolean | undefined;
  disableEscapeKeyDown?: boolean | undefined;
};

export const BaseModal = ({
  open,
  onClose,
  title,
  maxWidth = "sm",
  fullWidth = true,
  children,
  actions,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
}: BaseModalProps) => {
  const handleClose = (_: unknown, reason?: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick" && disableBackdropClick) {
      return;
    }

    if (reason === "escapeKeyDown" && disableEscapeKeyDown) {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableRestoreFocus={true}
      disableAutoFocus={false}
    >
      <DialogTitle>
        {title}

        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};
