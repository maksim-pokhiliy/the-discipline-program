import { UPLOAD_CONFIG, type UploadContext } from "@repo/contracts/storage/upload";
import { BadRequestError, ValidationError } from "@repo/errors";

import type { StoragePort } from "../../infrastructure/storage";

export type StorageUploadAdminApi = {
  uploadImage(file: File, context: UploadContext): Promise<{ url: string }>;
  deleteImage(url: string): Promise<void>;
};

export const createStorageUploadAdminApi = (storage: StoragePort): StorageUploadAdminApi => ({
  uploadImage: async (file, context) => {
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

    const result = await storage.put(filename, file, { access: "public" });

    return { url: result.url };
  },

  deleteImage: async (url) => {
    if (!url) {
      throw new BadRequestError("No URL provided");
    }

    await storage.delete(url);
  },
});
