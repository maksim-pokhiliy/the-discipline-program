import { put, del } from "@vercel/blob";

import { UPLOAD_CONFIG, type UploadContext } from "@repo/contracts/upload";
import { BadRequestError, ValidationError } from "@repo/errors";

export const adminUploadApi = {
  uploadImage: async (file: File, context: UploadContext): Promise<{ url: string }> => {
    const config = UPLOAD_CONFIG[context];

    if (!config.acceptedTypes.some((type) => type === file.type)) {
      throw new ValidationError(`Invalid file type. Allowed: ${config.acceptedTypes.join(", ")}`, {
        fileType: file.type,
        acceptedTypes: config.acceptedTypes,
      });
    }

    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);

      throw new ValidationError(`File too large (max ${maxSizeMB}MB)`, {
        fileSize: file.size,
        maxSize: config.maxSize,
      });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filename = `${config.storagePrefix}/${timestamp}-${safeName}`;

    const blob = await put(filename, file, {
      access: "public",
    });

    return { url: blob.url };
  },

  deleteImage: async (url: string): Promise<void> => {
    if (!url) {
      throw new BadRequestError("No URL provided");
    }

    await del(url);
  },
};
