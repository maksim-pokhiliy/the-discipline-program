"use client";

import { apiClient } from "../client";

export const uploadAPI = {
  avatar: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();

    formData.append("file", file);

    return apiClient.request("/api/upload/avatar", "POST", formData);
  },

  blogCover: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();

    formData.append("file", file);

    return apiClient.request("/api/upload/blog-cover", "POST", formData);
  },

  deleteAvatar: (url: string): Promise<void> =>
    apiClient.request("/api/upload/avatar", "DELETE", { url }),

  deleteBlogCover: (url: string): Promise<void> =>
    apiClient.request("/api/upload/blog-cover", "DELETE", { url }),
};
