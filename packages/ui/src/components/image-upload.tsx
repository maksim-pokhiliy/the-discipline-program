"use client";

import { useRef } from "react";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, CircularProgress, Stack, Typography, alpha, useTheme } from "@mui/material";

export interface ImageUploadProps {
  previewUrl?: string | null;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  isUploading?: boolean;
  disabled?: boolean;
  label?: string;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
}

export const ImageUpload = ({
  previewUrl,
  onFileSelect,
  onRemove,
  isUploading = false,
  disabled = false,
  label = "Upload Image",
  maxSizeBytes = 5 * 1024 * 1024,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
      event.target.value = "";
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const acceptAttribute = acceptedTypes.join(",");

  const formatSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(0)}MB`;

  const formatTypes = (types: string[]) =>
    types.map((t) => t.split("/")[1]?.toUpperCase()).filter(Boolean).join(", ");

  return (
    <Stack spacing={2} width="100%">
      {label && <Typography variant="subtitle2">{label}</Typography>}

      <Box
        sx={{
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1,
          p: 2,
          textAlign: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          transition: "all 0.2s",

          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept={acceptAttribute}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <Stack alignItems="center" py={4} spacing={2}>
            <CircularProgress size={24} />

            <Typography variant="caption" color="text.secondary">
              Uploading...
            </Typography>
          </Stack>
        ) : previewUrl ? (
          <Stack spacing={2} alignItems="center">
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: "100%",
                maxHeight: 300,
                borderRadius: 1,
                objectFit: "contain",
              }}
            />

            <Stack direction="row" spacing={2}>
              <Button
                size="small"
                variant="outlined"
                onClick={triggerSelect}
                disabled={disabled}
              >
                Change
              </Button>

              {onRemove && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={onRemove}
                  disabled={disabled}
                >
                  Remove
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            py={4}
            sx={{ cursor: "pointer" }}
            onClick={triggerSelect}
          >
            <CloudUploadIcon color="primary" sx={{ fontSize: 40, opacity: 0.5 }} />

            <Box>
              <Typography variant="body2" fontWeight={500}>
                Click to upload
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {formatTypes(acceptedTypes)} (max {formatSize(maxSizeBytes)})
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>
    </Stack>
  );
};
