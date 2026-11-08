"use client";

import { type ReactElement } from "react";

import { Stack, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

import { SHARED_FIELD_HELPER, useSectionField } from "./section-field-context";

type SectionImageFieldProps = { name: string; onRemoveImage?: (url: string) => void };

export const SectionImageField = ({
  name,
  onRemoveImage,
}: SectionImageFieldProps): ReactElement => {
  const { watch, setValue } = useFormContext<Record<string, string | undefined>>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const isShared = useSectionField(name).mode === "shared";
  const handleFileSelect = (file: File) => {
    if (isShared) {
      return;
    }

    uploadImage(
      { file, context: "marketing" },
      {
        onSuccess: ({ url }) => setValue(name, url, { shouldDirty: true }),
      },
    );
  };
  const handleRemove = () => {
    const currentUrl = watch(name);

    if (currentUrl) {
      onRemoveImage?.(currentUrl);
    }

    setValue(name, "", { shouldDirty: true });
  };

  return (
    <Stack spacing={1}>
      <ImageUpload
        previewUrl={watch(name) || ""}
        isUploading={isUploading}
        disabled={isShared}
        onFileSelect={handleFileSelect}
        {...(!isShared && { onRemove: handleRemove })}
      />
      {isShared && (
        <Typography variant="caption" color="text.secondary">
          {SHARED_FIELD_HELPER}
        </Typography>
      )}
    </Stack>
  );
};
