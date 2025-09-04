"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  TextField,
  Stack,
  Avatar,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState, useRef } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { adminApi } from "@app/lib/api";
import { UPLOAD_CONFIG } from "@app/shared/constants/upload";

import { ReviewFormData } from "../../shared/types";

interface AvatarFieldProps {
  control: Control<ReviewFormData>;
  errors: FieldErrors<ReviewFormData>;
  isSubmitting: boolean;
}

export const AvatarField = ({ control, errors, isSubmitting }: AvatarFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    file: File,
    onChange: (value: string) => void,
    currentUrl: string | null,
  ) => {
    setIsUploading(true);
    setUploadError(null);

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large (max 2MB)");
      setIsUploading(false);

      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      setIsUploading(false);

      return;
    }

    try {
      if (currentUrl && currentUrl.includes(UPLOAD_CONFIG.avatarStorage.domain)) {
        await adminApi.upload.deleteAvatar(currentUrl).catch(console.error);
      }

      const { url } = await adminApi.upload.avatar(file);

      onChange(url);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Author Avatar
      </Typography>

      <Controller
        name="authorAvatar"
        control={control}
        render={({ field }) => (
          <>
            <Stack spacing={2}>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                <Avatar
                  src={field.value ?? ""}
                  alt="Author avatar"
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: field.value ? "transparent" : "action.selected",
                  }}
                />

                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Stack spacing={1}>
                    <TextField
                      {...field}
                      label="Avatar URL"
                      error={!!errors.authorAvatar}
                      helperText={errors.authorAvatar?.message}
                      fullWidth
                      disabled={isSubmitting || isUploading}
                      size="small"
                      placeholder="https://example.com/avatar.jpg"
                    />

                    <Typography variant="caption" color="text.secondary">
                      Enter URL directly or upload a file below
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting || isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload File"}
                    </Button>

                    {field.value && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          field.onChange(null);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        disabled={isSubmitting || isUploading}
                      >
                        Clear
                      </Button>
                    )}
                  </Stack>

                  {uploadError && (
                    <Alert severity="error" onClose={() => setUploadError(null)}>
                      {uploadError}
                    </Alert>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Recommended: 200x200px, max 2MB (JPG, PNG, WebP, GIF)
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleFileUpload(file, field.onChange, field.value);
                }
              }}
              disabled={isSubmitting || isUploading}
            />
          </>
        )}
      />
    </Box>
  );
};
