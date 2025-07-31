import { DialogActions, Button, Box, CircularProgress, Alert, Stack } from "@mui/material";
import { ReactNode, FormEvent } from "react";
import { BaseModal, BaseModalProps } from "./base-modal";

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
        <Box sx={{ p: 3, flexGrow: 1 }}>
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
          <DialogActions
            sx={{
              p: 3,
              borderTop: 1,
              borderColor: "divider",
              gap: 2,
            }}
          >
            <Button
              onClick={onClose}
              disabled={isSubmitting}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              {cancelText}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitDisabled || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
              sx={{ minWidth: 100 }}
            >
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </DialogActions>
        )}
      </Stack>
    </BaseModal>
  );
};
