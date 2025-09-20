import {
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import { BaseModal, BaseModalProps } from "./base-modal";

export interface ConfirmationModalProps extends Omit<BaseModalProps, "children"> {
  type: "warning" | "danger" | "info";
  message: string;
  details?: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  showCancel?: boolean;
  error?: string | null;
}

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
  showCancel = true,
  error,
  onClose,
  ...baseProps
}: ConfirmationModalProps) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <BaseModal
      {...baseProps}
      onClose={onClose}
      disableBackdropClick={isConfirming}
      disableEscapeKeyDown={isConfirming}
      maxWidth="xs"
    >
      <Stack
        spacing={2}
        direction="row"
        sx={{
          alignItems: "flex-start",
          p: 2,
          flexGrow: 1,
        }}
      >
        <Stack
          sx={{
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: `${config.color}.light`,
            color: "common.white",
            flexShrink: 0,
          }}
        >
          <IconComponent fontSize="medium" />
        </Stack>

        <Stack sx={{ flexGrow: 1 }} spacing={2}>
          <Typography variant="body1">{message}</Typography>

          {details && (
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <DialogActions>
        {showCancel && (
          <Button onClick={onClose} disabled={isConfirming} variant="outlined" size="small">
            {cancelText}
          </Button>
        )}

        <Button
          onClick={handleConfirm}
          size="small"
          disabled={isConfirming}
          variant="contained"
          color={config.color}
          startIcon={isConfirming ? <CircularProgress size={16} /> : null}
        >
          {isConfirming ? "Processing..." : finalConfirmText}
        </Button>
      </DialogActions>
    </BaseModal>
  );
};
