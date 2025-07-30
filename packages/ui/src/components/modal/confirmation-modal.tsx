import { DialogActions, Button, Typography, Box, CircularProgress, Alert } from "@mui/material";
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
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={(theme) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: `${config.color}.light`,
              color: theme.palette.mode === "dark" ? "common.white" : `${config.color}.dark`,
              flexShrink: 0,
            })}
          >
            <IconComponent />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              {message}
            </Typography>

            {details && (
              <Typography variant="body2" color="text.secondary">
                {details}
              </Typography>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <DialogActions sx={{ p: 0, gap: 2 }}>
          <Button
            onClick={onClose}
            disabled={isConfirming}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {cancelText}
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            variant="contained"
            color={config.color}
            startIcon={isConfirming ? <CircularProgress size={16} /> : null}
            sx={{ minWidth: 100 }}
          >
            {isConfirming ? "Processing..." : finalConfirmText}
          </Button>
        </DialogActions>
      </Box>
    </BaseModal>
  );
};
