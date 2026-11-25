"use client";

import { type ReactElement } from "react";

import { useFormContext } from "react-hook-form";

import { UPLOAD_CONFIG } from "@repo/contracts/storage/upload";
import { ImageUpload } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";
import { useUploadImage } from "@app/lib/hooks";

import { type ProductFormData } from "./product-form-schema";

type ProductPhotoCardProps = { isLoading: boolean };

export const ProductPhotoCard = ({ isLoading }: ProductPhotoCardProps): ReactElement => {
  const { watch, setValue } = useFormContext<ProductFormData>();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  return (
    <FormCard title="Photo" subtitle="Shared by every language. The product saves without one.">
      <ImageUpload
        label="Product photo"
        previewUrl={watch("imageUrl") ?? null}
        maxSizeBytes={UPLOAD_CONFIG.product.maxSize}
        acceptedTypes={[...UPLOAD_CONFIG.product.acceptedTypes]}
        disabled={isLoading}
        isUploading={isUploading}
        onFileSelect={(file) =>
          uploadImage(
            { file, context: "product" },
            { onSuccess: ({ url }) => setValue("imageUrl", url, { shouldDirty: true }) },
          )
        }
        onRemove={() => setValue("imageUrl", null, { shouldDirty: true })}
      />
    </FormCard>
  );
};
