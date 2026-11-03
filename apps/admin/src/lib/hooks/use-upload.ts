"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { type UploadContext } from "@repo/contracts/storage/upload";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const IMAGE_MUTATION_KEY = [...adminKeys.root, "images"] as const;

export const useUploadImage = () => {
  return useMutation({
    mutationKey: IMAGE_MUTATION_KEY,
    mutationFn: ({ file, context }: { file: File; context: UploadContext }) =>
      api.upload.uploadImage(file, context),
    onError: (error) => {
      notifyError(error, "Failed to upload image");
    },
  });
};

export const useDeleteImage = () => {
  return useMutation({
    mutationKey: IMAGE_MUTATION_KEY,
    mutationFn: (url: string) => api.upload.deleteImage(url),
    onSuccess: () => {
      toast.success("Image deleted");
    },
    onError: (error) => {
      notifyError(error, "Failed to delete image");
    },
  });
};
