import { type ApiClient } from "@repo/api-client";
import { type UploadContext } from "@repo/contracts/upload";

export const createUploadAPI = (client: ApiClient) => ({
  uploadImage: (file: File, context: UploadContext) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("context", context);

    return client.request<{ url: string }>("/api/admin/upload/image", "POST", formData);
  },
});
