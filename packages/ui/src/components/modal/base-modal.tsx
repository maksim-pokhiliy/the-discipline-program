"use client";

import { type ReactNode } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  type DialogProps,
} from "@mui/material";

const MODAL_SUBTITLE_FONT_SIZE_PX = 11;
const MODAL_SUBTITLE_FONT_WEIGHT = 600;
const MODAL_SUBTITLE_LETTER_SPACING = "0.04em";
const MODAL_TITLE_GAP = 1;

export type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode | undefined;
  maxWidth?: DialogProps["maxWidth"] | undefined;
  fullWidth?: boolean | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
  disableBackdropClick?: boolean | undefined;
  disableEscapeKeyDown?: boolean | undefined;
  onTransitionExited?: (() => void) | undefined;
};

export const BaseModal = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "sm",
  fullWidth = true,
  children,
  actions,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  onTransitionExited,
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
      slotProps={{ transition: { onExited: onTransitionExited } }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={MODAL_TITLE_GAP} sx={{ alignItems: "baseline" }}>
          <span>{title}</span>

          {subtitle !== undefined && (
            <Box
              component="span"
              sx={{
                fontSize: `${MODAL_SUBTITLE_FONT_SIZE_PX}px`,
                fontWeight: MODAL_SUBTITLE_FONT_WEIGHT,
                letterSpacing: MODAL_SUBTITLE_LETTER_SPACING,
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {subtitle}
            </Box>
          )}
        </Stack>

        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
};
