"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { type UploadContext } from "@repo/contracts/iam/upload";

import { api } from "../api";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: ({ file, context }: { file: File; context: UploadContext }) =>
      api.upload.uploadImage(file, context),
    onError: (error) => {
      toast.error(error.message || "Failed to upload image");
    },
  });
};

export const useDeleteImage = () => {
  return useMutation({
    mutationFn: (url: string) => api.upload.deleteImage(url),
    onSuccess: () => {
      toast.success("Image deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });
};
