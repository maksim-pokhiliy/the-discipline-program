"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { UPLOAD_CONFIG } from "@repo/api";
import { useRef } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { useUploadMutations } from "@app/lib/hooks";
import { BlogFormInputs } from "@app/modules/blog/shared";

interface MediaFieldProps {
  control: Control<BlogFormInputs, unknown>;
  errors: FieldErrors<BlogFormInputs>;
  isSubmitting: boolean;
  onCoverChange: (url: string | null) => void;
}

export const MediaField = ({ control, errors, isSubmitting, onCoverChange }: MediaFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadBlogCover, deleteBlogCover } = useUploadMutations();

  const handleFileUpload = async (
    file: File,
    onChange: (value: string | null) => void,
    currentUrl: string | null,
  ) => {
    try {
      if (currentUrl && currentUrl.includes("blob.vercel-storage.com")) {
        await deleteBlogCover.mutateAsync(currentUrl).catch(console.error);
      }

      const { url } = await uploadBlogCover.mutateAsync(file);

      onChange(url);
      onCoverChange(url);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Cover upload error:", error);
    }
  };

  const isUploading = uploadBlogCover.isPending || deleteBlogCover.isPending;
  const uploadError = uploadBlogCover.error || deleteBlogCover.error;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Cover Image</Typography>

      <Controller
        name="coverImage"
        control={control}
        render={({ field }) => (
          <Stack spacing={3}>
            <Box
              sx={{
                width: "100%",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                aspectRatio: "16/9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: field.value ? "transparent" : "action.hover",
              }}
            >
              {field.value ? (
                <Box
                  component="img"
                  src={field.value}
                  alt="Blog cover"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Stack spacing={1} alignItems="center" color="text.secondary">
                  <ImageIcon fontSize="large" />
                  <Typography variant="body2">Upload or paste a cover image URL</Typography>
                </Stack>
              )}
            </Box>

            <Stack spacing={1}>
              <TextField
                {...field}
                label="Cover image URL"
                fullWidth
                error={!!errors.coverImage}
                helperText={errors.coverImage?.message}
                disabled={isSubmitting || isUploading}
                placeholder="https://example.com/blog-cover.jpg"
                onChange={(event) => {
                  field.onChange(event.target.value);
                  onCoverChange(event.target.value || null);
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Recommended size: 1280x720px. Max {UPLOAD_CONFIG.blogCover.maxSize / 1024 / 1024}MB
                (
                {UPLOAD_CONFIG.blogCover.acceptedTypes
                  .map((type) => type.split("/")[1]?.toUpperCase())
                  .join(", ")}
                )
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
                    onCoverChange(null);

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
                  uploadBlogCover.reset();
                  deleteBlogCover.reset();
                }}
              >
                {uploadError instanceof Error ? uploadError.message : "Upload failed"}
              </Alert>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_CONFIG.blogCover.acceptedTypes.join(",")}
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleFileUpload(file, field.onChange, field.value);
                }
              }}
              disabled={isSubmitting || isUploading}
            />
          </Stack>
        )}
      />
    </Stack>
  );
};
