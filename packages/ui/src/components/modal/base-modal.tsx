import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Stack,
  DialogProps,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode } from "react";

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  children: ReactNode;
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle component={Stack} direction="row">
        <Typography variant="body2">{title}</Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
