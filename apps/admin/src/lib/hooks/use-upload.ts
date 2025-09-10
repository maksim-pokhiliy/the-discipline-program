"use client";

import { UPLOAD_CONFIG } from "@repo/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

export const useUploadMutations = () => {
  const queryClient = useQueryClient();

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const { maxSize, acceptedTypes } = UPLOAD_CONFIG.avatar;

      if (!acceptedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
      }

      if (file.size > maxSize) {
        throw new Error("File too large (max 2MB)");
      }

      return api.upload.avatar(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });

  const deleteAvatar = useMutation({
    mutationFn: (url: string) => api.upload.deleteAvatar(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });

  return {
    uploadAvatar,
    deleteAvatar,
  };
};
