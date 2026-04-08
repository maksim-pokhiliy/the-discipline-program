import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import { Button, Typography, CircularProgress, Alert, Stack, Avatar } from "@mui/material";

import { BaseModal, type BaseModalProps } from "./base-modal";

export type ConfirmationModalProps = Omit<BaseModalProps, "children" | "actions"> & {
  type: "warning" | "danger" | "info";
  message: string;
  details?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  error?: string | null;
};

const typeConfig = {
  warning: {
    icon: WarningIcon,
    color: "warning" as const,
    defaultConfirmText: "Proceed",
  },
  danger: {
    icon: ErrorIcon,
    color: "error" as const,
    defaultConfirmText: "Delete",
  },
  info: {
    icon: InfoIcon,
    color: "info" as const,
    defaultConfirmText: "Confirm",
  },
};

export const ConfirmationModal = ({
  type,
  message,
  details,
  onConfirm,
  confirmText,
  cancelText = "Cancel",
  isConfirming = false,
  error,
  onClose,
  ...baseProps
}: ConfirmationModalProps) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  return (
    <BaseModal
      {...baseProps}
      onClose={onClose}
      disableBackdropClick={isConfirming}
      disableEscapeKeyDown={isConfirming}
      maxWidth="xs"
      actions={
        <Stack direction="row" spacing={2}>
          <Button onClick={onClose} disabled={isConfirming} size="small">
            {cancelText}
          </Button>

          <Button
            onClick={onConfirm}
            size="small"
            disabled={isConfirming}
            variant="contained"
            color={config.color}
            startIcon={isConfirming ? <CircularProgress size={16} /> : null}
          >
            {isConfirming ? "Processing..." : finalConfirmText}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2} direction="row">
        <Avatar>
          <IconComponent color="action" />
        </Avatar>

        <Stack sx={{ flexGrow: 1 }}>
          <Typography variant="body1">{message}</Typography>

          {details && (
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
    </BaseModal>
  );
};
