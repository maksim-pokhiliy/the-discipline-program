"use client";

import ImageIcon from "@mui/icons-material/Image";
import { Box, Stack, TextField, Typography } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { BlogFormData } from "@app/modules/blog/shared";

interface MediaFieldProps {
  control: Control<BlogFormData>;
  errors: FieldErrors<BlogFormData>;
  isSubmitting: boolean;
}

export const MediaField = ({ control, errors, isSubmitting }: MediaFieldProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Controller
      name="coverImage"
      control={control}
      render={({ field }) => (
        <Stack spacing={2}>
          <TextField
            {...field}
            value={field.value || ""}
            label="Cover Image URL"
            error={!!errors.coverImage}
            helperText={errors.coverImage?.message || "URL of the cover image"}
            fullWidth
            disabled={isSubmitting}
            placeholder="https://example.com/image.jpg"
            onChange={(e) => {
              field.onChange(e);
              setImageError(false);
            }}
          />

          {field.value && !imageError && (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 200,
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "grey.100",
              }}
            >
              <Image
                src={field.value}
                alt="Cover preview"
                fill
                style={{ objectFit: "cover" }}
                onError={() => setImageError(true)}
              />

              <Box
                sx={(theme) => ({
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                  opacity: 0,
                  transition: theme.transitions.create("opacity"),
                  "&:hover": {
                    opacity: 1,
                  },
                })}
              >
                <Stack alignItems="center" spacing={1}>
                  <ImageIcon />

                  <Typography variant="caption">Cover Image Preview</Typography>
                </Stack>
              </Box>
            </Box>
          )}

          {imageError && field.value && (
            <Typography variant="caption" color="error">
              Failed to load image. Please check the URL.
            </Typography>
          )}
        </Stack>
      )}
    />
  );
};
