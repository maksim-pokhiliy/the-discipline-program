import { type UploadContext } from "@repo/contracts/upload";

import { apiClient } from "../client";

export const uploadAPI = {
  uploadImage: (file: File, context: UploadContext) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("context", context);

    return apiClient.request<{ url: string }>("/api/admin/upload/image", "POST", formData);
  },

  deleteImage: (url: string) =>
    apiClient.request("/api/admin/upload/image", "DELETE", { url }),
};
