import { put, del } from "@vercel/blob";

import { blobEnv } from "@repo/env/blob";

import type { StoragePort } from "./port";

export const createVercelBlobAdapter = (): StoragePort => {
  void blobEnv.BLOB_READ_WRITE_TOKEN;

  return {
    put: async (key, file, options) => {
      const result = await put(key, file, {
        access: options?.access ?? "public",
      });

      return { url: result.url };
    },
    delete: async (url) => {
      await del(url);
    },
  };
};
