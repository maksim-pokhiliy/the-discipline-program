import { type ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  type DialogProps,
} from "@mui/material";

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  children: ReactNode;
  actions?: ReactNode;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

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
      <DialogTitle component={Stack} direction="row">
        {title}

        <IconButton onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};
