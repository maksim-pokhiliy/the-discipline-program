"use client";

import { UPLOAD_CONFIG } from "@repo/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";

type UploadConfigKey = keyof typeof UPLOAD_CONFIG;

const formatAcceptedTypes = (acceptedTypes: string[]) =>
  acceptedTypes.map((type) => type.split("/")[1]?.toUpperCase() ?? type).join(", ");

const validateFile = (file: File, configKey: UploadConfigKey) => {
  const { maxSize, acceptedTypes } = UPLOAD_CONFIG[configKey];

  if (!acceptedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${formatAcceptedTypes(acceptedTypes)}`);
  }

  if (file.size > maxSize) {
    const maxSizeInMb = Math.round(maxSize / (1024 * 1024));

    throw new Error(`File too large (max ${maxSizeInMb}MB)`);
  }
};

export const useUploadMutations = () => {
  const queryClient = useQueryClient();

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  const invalidateBlog = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "blog", "page-data"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "blog", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      validateFile(file, "avatar");

      return api.upload.avatar(file);
    },
    onSuccess: invalidateReviews,
  });

  const deleteAvatar = useMutation({
    mutationFn: (url: string) => api.upload.deleteAvatar(url),
    onSuccess: invalidateReviews,
  });

  const uploadBlogCover = useMutation({
    mutationFn: async (file: File) => {
      validateFile(file, "blogCover");

      return api.upload.blogCover(file);
    },
    onSuccess: invalidateBlog,
  });

  const deleteBlogCover = useMutation({
    mutationFn: (url: string) => api.upload.deleteBlogCover(url),
    onSuccess: invalidateBlog,
  });

  return {
    uploadAvatar,
    deleteAvatar,
    uploadBlogCover,
    deleteBlogCover,
  };
};
