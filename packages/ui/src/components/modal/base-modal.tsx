import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode } from "react";

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
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
    if (reason === "backdropClick" && disableBackdropClick) return;
    if (reason === "escapeKeyDown" && disableEscapeKeyDown) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography>{title}</Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",

            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
