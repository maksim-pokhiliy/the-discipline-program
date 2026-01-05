import { apiClient } from "../client";

export const uploadAPI = {
  avatar: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();

    formData.append("file", file);

    return apiClient.request("/api/admin/upload/avatar", "POST", formData);
  },

  deleteAvatar: (url: string): Promise<void> =>
    apiClient.request("/api/admin/upload/avatar", "DELETE", { url }),
};
