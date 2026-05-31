import { del, list, put } from "@vercel/blob";

import { blobEnv } from "@repo/env/blob";

import type { StoragePort } from "./port";

const BLOB_TIMEOUT_MS = 30_000;

export const createVercelBlobAdapter = (): StoragePort => {
  void blobEnv.BLOB_READ_WRITE_TOKEN;

  return {
    put: async (key, file, options) => {
      const result = await put(key, file, {
        access: options?.access ?? "public",
        abortSignal: AbortSignal.timeout(BLOB_TIMEOUT_MS),
      });

      return { url: result.url };
    },
    delete: async (url) => {
      await del(url, { abortSignal: AbortSignal.timeout(BLOB_TIMEOUT_MS) });
    },
  };
};

export const checkBlobStorage = async (): Promise<void> => {
  await list({ limit: 1, abortSignal: AbortSignal.timeout(BLOB_TIMEOUT_MS) });
};
