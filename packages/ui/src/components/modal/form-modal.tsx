import { type ReactNode, type FormEvent } from "react";

import { DialogActions, Button, Box, CircularProgress, Alert, Stack } from "@mui/material";

import { BaseModal, type BaseModalProps } from "./base-modal";

export interface FormModalProps extends Omit<BaseModalProps, "children"> {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  error?: string | null;
  hideActions?: boolean;
}

export const FormModal = ({
  children,
  onSubmit,
  isSubmitting = false,
  submitText = "Save",
  cancelText = "Cancel",
  submitDisabled = false,
  error,
  hideActions = false,
  onClose,
  disableBackdropClick,
  disableEscapeKeyDown,
  ...baseProps
}: FormModalProps) => {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(event);
  };

  const shouldDisableClose = isSubmitting || disableBackdropClick;
  const shouldDisableEscape = isSubmitting || disableEscapeKeyDown;

  return (
    <BaseModal
      {...baseProps}
      onClose={onClose}
      disableBackdropClick={shouldDisableClose}
      disableEscapeKeyDown={shouldDisableEscape}
    >
      <Stack component="form" onSubmit={handleSubmit}>
        <Box sx={{ p: 2, flexGrow: 1 }}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {children}
          </Stack>
        </Box>

        {!hideActions && (
          <DialogActions>
            <Button onClick={onClose} disabled={isSubmitting} size="small" variant="outlined">
              {cancelText}
            </Button>

            <Button
              size="small"
              type="submit"
              variant="contained"
              disabled={submitDisabled || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </DialogActions>
        )}
      </Stack>
    </BaseModal>
  );
};
