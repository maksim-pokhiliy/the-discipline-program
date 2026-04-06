import { type ReactNode, type FormEvent, useId } from "react";

import { Button, CircularProgress, Alert, Stack } from "@mui/material";

import { BaseModal, type BaseModalProps } from "./base-modal";

export interface FormModalProps extends Omit<BaseModalProps, "children" | "actions"> {
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
  const formId = useId();

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
      actions={
        !hideActions && (
          <>
            <Button onClick={onClose} disabled={isSubmitting} size="small">
              {cancelText}
            </Button>

            <Button
              size="small"
              type="submit"
              form={formId}
              variant="contained"
              disabled={submitDisabled || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isSubmitting ? "Saving..." : submitText}
            </Button>
          </>
        )
      }
    >
      <Stack component="form" id={formId} onSubmit={handleSubmit} spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {children}
      </Stack>
    </BaseModal>
  );
};
