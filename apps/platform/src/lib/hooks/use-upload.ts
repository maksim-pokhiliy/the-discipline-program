"use client";

import { useMutation } from "@tanstack/react-query";

import { type UploadContext } from "@repo/contracts/storage/upload";
import { notifyError } from "@repo/query";

import { api } from "../api";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: ({ file, context }: { file: File; context: UploadContext }) =>
      api.upload.uploadImage(file, context),
    onError: (error) => {
      notifyError(error, "Failed to upload image");
    },
  });
};
