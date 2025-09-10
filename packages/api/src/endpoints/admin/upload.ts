import { put, del } from "@vercel/blob";
import { UPLOAD_CONFIG } from "../../constants";

export const adminUploadApi = {
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const { maxSize, acceptedTypes, storagePrefix } = UPLOAD_CONFIG.avatar;

    if (!acceptedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
    }

    if (file.size > maxSize) {
      throw new Error("File too large (max 2MB)");
    }

    const timestamp = Date.now();
    const filename = `${storagePrefix}/${timestamp}-${file.name}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return { url: blob.url };
  },

  deleteAvatar: async (url: string): Promise<void> => {
    if (!url) {
      throw new Error("No URL provided");
    }

    await del(url);
  },
};
