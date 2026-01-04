"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { UPLOAD_CONFIG } from "@repo/contracts/upload";
import { ValidationError } from "@repo/errors";
import { adminKeys } from "@repo/query";

import { api } from "../api";

export const useUploadMutations = () => {
  const queryClient = useQueryClient();

  const invalidateAffected = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.reviews.page() });
  };

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const { maxSize, acceptedTypes } = UPLOAD_CONFIG.avatar;

      if (!acceptedTypes.some((type) => type === file.type)) {
        throw new ValidationError("Invalid file type. Allowed: JPG, PNG, WebP, GIF", {
          fileType: file.type,
          acceptedTypes,
        });
      }

      if (file.size > maxSize) {
        throw new ValidationError("File too large (max 2MB)", {
          fileSize: file.size,
          maxSize,
        });
      }

      return api.upload.avatar(file);
    },
    onSuccess: invalidateAffected,
  });

  const deleteAvatar = useMutation({
    mutationFn: (url: string) => api.upload.deleteAvatar(url),
    onSuccess: invalidateAffected,
  });

  return {
    uploadAvatar,
    deleteAvatar,
  };
};
