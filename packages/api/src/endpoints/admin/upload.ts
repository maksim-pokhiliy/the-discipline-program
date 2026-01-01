import { put, del } from "@vercel/blob";
import { UPLOAD_CONFIG } from "../../constants";
import { BadRequestError, ValidationError } from "@repo/errors";

export const adminUploadApi = {
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const { maxSize, acceptedTypes, storagePrefix } = UPLOAD_CONFIG.avatar;

    if (!acceptedTypes.includes(file.type)) {
      throw new ValidationError("Invalid file type. Allowed: JPG, PNG, WebP, GIF", {
        fileType: file.type,
        acceptedTypes,
      });
    }

    if (file.size > maxSize) {
      throw new ValidationError("File too large (max 2MB)", {
        fileSize: file.size,
        maxSize,
      });
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
      throw new BadRequestError("No URL provided");
    }

    await del(url);
  },
};
