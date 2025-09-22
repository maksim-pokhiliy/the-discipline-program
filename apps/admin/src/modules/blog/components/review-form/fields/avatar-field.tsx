"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { UPLOAD_CONFIG } from "@repo/api";
import { useRef } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { useUploadMutations } from "@app/lib/hooks";
import { ReviewFormData } from "@app/modules/reviews/shared";

interface AvatarFieldProps {
  control: Control<ReviewFormData>;
  errors: FieldErrors<ReviewFormData>;
  isSubmitting: boolean;
}

export const AvatarField = ({ control, errors, isSubmitting }: AvatarFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar } = useUploadMutations();

  const handleFileUpload = async (
    file: File,
    onChange: (value: string) => void,
    currentUrl: string | null,
  ) => {
    try {
      if (currentUrl && currentUrl.includes("blob.vercel-storage.com")) {
        await deleteAvatar.mutateAsync(currentUrl).catch(console.error);
      }

      const { url } = await uploadAvatar.mutateAsync(file);

      onChange(url);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const isUploading = uploadAvatar.isPending || deleteAvatar.isPending;
  const uploadError = uploadAvatar.error || deleteAvatar.error;

  return (
    <Stack>
      <Typography variant="h6">Author Avatar</Typography>

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
                          field.onChange("");

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
                    <Alert
                      severity="error"
                      onClose={() => {
                        uploadAvatar.reset();
                        deleteAvatar.reset();
                      }}
                    >
                      {uploadError instanceof Error ? uploadError.message : "Upload failed"}
                    </Alert>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Recommended: 200x200px, max {UPLOAD_CONFIG.avatar.maxSize / 1024 / 1024}MB (JPG,
                    PNG, WebP, GIF)
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_CONFIG.avatar.acceptedTypes.join(",")}
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
    </Stack>
  );
};
